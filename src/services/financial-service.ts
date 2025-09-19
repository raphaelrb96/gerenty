
'use server';

import { getOrdersForCompanies } from './order-service';
import { getRoutes } from './logistics-service';
import type { FinancialData, Order } from '@/lib/types';
import { eachDayOfInterval, format, startOfDay, endOfDay, differenceInDays } from 'date-fns';

export async function getFinancialData(ownerId: string, companyIds: string[], from: Date, to: Date): Promise<FinancialData> {
    const orders = await getOrdersForCompanies(companyIds);
    const routes = await getRoutes(ownerId);

    const completedOrdersInDateRange: Order[] = orders.filter(order => {
        const orderDate = new Date(order.createdAt as string);
        const isSale = !order.type || order.type === 'sale';
        return isSale && order.status === 'completed' && orderDate >= startOfDay(from) && orderDate <= endOfDay(to);
    });

    // 1. Faturamento (Receita)
    const revenue = completedOrdersInDateRange.reduce((sum, order) => sum + order.total, 0);

    // 2. Custos e Despesas
    const totalProductCost = completedOrdersInDateRange.reduce((sum, order) => {
        const orderCost = order.items.reduce((itemSum, item) => itemSum + (item.costPrice || 0) * item.quantity, 0);
        return sum + orderCost;
    }, 0);

    const totalCommissions = completedOrdersInDateRange.reduce((sum, order) => sum + (order.commission || 0), 0);

    const relevantRouteIds = new Set(completedOrdersInDateRange.map(o => o.shipping?.routeId).filter(Boolean));
    const totalDeliveryPayments = Array.from(relevantRouteIds).reduce((acc, routeId) => {
        const route = routes.find(r => r.id === routeId);
        if (route && route.finalizationDetails?.driverFinalPayment) {
            return acc + route.finalizationDetails.driverFinalPayment;
        }
        return acc;
    }, 0);
    
    const totalExpenses = totalCommissions + totalDeliveryPayments;

    // 3. Lucros
    const grossProfit = revenue - totalProductCost;
    const netProfit = grossProfit - totalExpenses;
    
    // 4. KPIs
    const profitMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;
    const averageTicket = completedOrdersInDateRange.length > 0 ? revenue / completedOrdersInDateRange.length : 0;

    // 5. Gráfico de Desempenho por Período
    const performanceByPeriod: { [key: string]: { Receita: number, Custos: number, Lucro: number } } = {};
    const dateFormat = differenceInDays(to, from) > 31 ? 'MMM/yy' : 'dd/MM';
    const intervalDays = eachDayOfInterval({ start: from, end: to });
    intervalDays.forEach(day => {
        performanceByPeriod[format(day, dateFormat)] = { Receita: 0, Custos: 0, Lucro: 0 };
    });

    completedOrdersInDateRange.forEach(order => {
        const dateStr = format(new Date(order.createdAt as string), dateFormat);
        if (performanceByPeriod[dateStr]) {
            const orderProductCost = order.items.reduce((sum, item) => sum + (item.costPrice || 0) * item.quantity, 0);
            const orderCommission = order.commission || 0;
            const orderRoute = routes.find(r => r.id === order.shipping?.routeId);
            const orderDeliveryPayment = (orderRoute?.finalizationDetails?.driverFinalPayment && orderRoute.orders.length > 0)
                ? orderRoute.finalizationDetails.driverFinalPayment / orderRoute.orders.length
                : 0;

            const orderTotalCost = orderProductCost + orderCommission + orderDeliveryPayment;
            const orderProfit = order.total - orderTotalCost;

            performanceByPeriod[dateStr].Receita += order.total;
            performanceByPeriod[dateStr].Custos += orderTotalCost;
            performanceByPeriod[dateStr].Lucro += orderProfit;
        }
    });

    // 6. Distribuição de Despesas
    const expenseDistribution = [
        { name: 'Comissões', value: totalCommissions },
        { name: 'Pagamento de Entregadores', value: totalDeliveryPayments },
        // Add other categories as they become available
    ].filter(item => item.value > 0);


    // 7. Top Produtos por Lucro
    const productProfits: { [key: string]: { name: string, profit: number } } = {};
    completedOrdersInDateRange.forEach(order => {
        order.items.forEach(item => {
            const orderProductCost = (item.costPrice || 0) * item.quantity;
            const itemRevenue = item.totalPrice;

            const orderCommission = order.commission || 0;
            const proratedCommission = order.subtotal > 0 ? (itemRevenue / order.subtotal) * orderCommission : 0;
            
            const orderRoute = routes.find(r => r.id === order.shipping?.routeId);
            const orderDeliveryPayment = (orderRoute?.finalizationDetails?.driverFinalPayment && orderRoute.orders.length > 0)
                ? (itemRevenue / order.total) * (orderRoute.finalizationDetails.driverFinalPayment / orderRoute.orders.length) // Highly approximated proration
                : 0;
            
            const itemTotalCost = orderProductCost + proratedCommission + orderDeliveryPayment;
            const itemProfit = itemRevenue - itemTotalCost;

            if (!productProfits[item.productId]) {
                productProfits[item.productId] = { name: item.productName, profit: 0 };
            }
            productProfits[item.productId].profit += itemProfit;
        });
    });

    const topProductsByProfit = Object.values(productProfits)
        .sort((a, b) => b.profit - a.profit)
        .slice(0, 5);


    return {
        revenue,
        grossProfit,
        totalExpenses,
        netProfit,
        profitMargin,
        averageTicket,
        performanceByPeriod: Object.entries(performanceByPeriod).map(([period, data]) => ({ period, ...data })),
        expenseDistribution,
        topProductsByProfit
    };
}

export type { FinancialData };
