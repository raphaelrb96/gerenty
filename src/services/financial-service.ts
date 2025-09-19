
'use server';

import { getOrdersForCompanies } from './order-service';
import { getRoutes } from './logistics-service';
import type { Order, Route } from '@/lib/types';
import { eachDayOfInterval, format, startOfDay, endOfDay, differenceInDays } from 'date-fns';

export interface FinancialData {
    netRevenue: number;
    grossProfit: number;
    totalExpenses: number;
    netProfit: number;
    performanceByPeriod: { period: string, Receita: number, Custos: number, Lucro: number }[];
}

export async function getFinancialData(companyIds: string[], from: Date, to: Date): Promise<FinancialData> {
    const orders = await getOrdersForCompanies(companyIds);
    const routes = await getRoutes(companyIds[0]); // Assuming ownerId is the first companyId, which is not robust. Needs refactor if multi-owner logic changes.

    const completedOrdersInDateRange = orders.filter(order => {
        const orderDate = new Date(order.createdAt as string);
        const isSale = !order.type || order.type === 'sale';
        return isSale && order.status === 'completed' && orderDate >= startOfDay(from) && orderDate <= endOfDay(to);
    });

    const netRevenue = completedOrdersInDateRange.reduce((sum, order) => sum + order.total, 0);
    
    // Total product cost (CMV)
    const totalProductCosts = completedOrdersInDateRange.reduce((sum, order) => {
        const orderCost = order.items.reduce((itemSum, item) => itemSum + (item.costPrice || 0) * item.quantity, 0);
        return sum + orderCost;
    }, 0);
    
    // Total expenses (commissions + delivery payments)
    const totalCommissions = completedOrdersInDateRange.reduce((sum, order) => sum + (order.commission || 0), 0);

    const relevantRouteIds = new Set<string>();
    completedOrdersInDateRange.forEach(order => {
        if (order.shipping?.routeId) {
            relevantRouteIds.add(order.shipping.routeId);
        }
    });

    const totalDeliveryPayments = Array.from(relevantRouteIds).reduce((acc, routeId) => {
        const route = routes.find(r => r.id === routeId);
        if (route && route.finalizationDetails?.driverFinalPayment) {
            return acc + route.finalizationDetails.driverFinalPayment;
        }
        return acc;
    }, 0);

    const totalExpenses = totalCommissions + totalDeliveryPayments;

    const grossProfit = netRevenue - totalProductCosts;
    const netProfit = grossProfit - totalExpenses;

    // Group performance by period for charting
    const performanceByPeriod: { [key: string]: { Receita: number, Custos: number, Lucro: number } } = {};
    const days = eachDayOfInterval({ start: from, end: to });
    
    const dateFormat = differenceInDays(to, from) > 31 ? 'MMM/yy' : 'dd/MM';

    days.forEach(day => {
        performanceByPeriod[format(day, dateFormat)] = { Receita: 0, Custos: 0, Lucro: 0 };
    });

    completedOrdersInDateRange.forEach(order => {
        const dateStr = format(new Date(order.createdAt as string), dateFormat);
        if (performanceByPeriod.hasOwnProperty(dateStr)) {
            const orderCost = order.items.reduce((itemSum, item) => itemSum + (item.costPrice || 0) * item.quantity, 0);
            const orderCommission = order.commission || 0;
            const orderRoute = routes.find(r => r.id === order.shipping?.routeId);
            const orderDeliveryPayment = orderRoute?.finalizationDetails?.driverFinalPayment 
                ? orderRoute.finalizationDetails.driverFinalPayment / (orderRoute.orders.length || 1) // Prorated
                : 0;

            const orderTotalCost = orderCost + orderCommission + orderDeliveryPayment;
            const orderProfit = order.total - orderTotalCost;
            
            performanceByPeriod[dateStr].Receita += order.total;
            performanceByPeriod[dateStr].Custos += orderTotalCost;
            performanceByPeriod[dateStr].Lucro += orderProfit;
        }
    });

    const performanceChartData = Object.entries(performanceByPeriod).map(([period, data]) => ({
        period,
        ...data,
    }));


    return {
        netRevenue,
        grossProfit,
        totalExpenses,
        netProfit,
        performanceByPeriod: performanceChartData,
    };
}
