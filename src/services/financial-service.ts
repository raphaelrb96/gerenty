
'use server';

import { getOrdersForCompanies } from './order-service';
import type { Order } from '@/lib/types';
import { eachDayOfInterval, format, startOfDay, endOfDay, differenceInDays } from 'date-fns';

export interface FinancialData {
    netRevenue: number;
    totalCosts: number;
    grossProfit: number;
    averageTicket: number;
    totalOrders: number;
    revenueByPeriod: { period: string, total: number }[];
}

export async function getFinancialData(companyIds: string[], from: Date, to: Date): Promise<FinancialData> {
    const orders = await getOrdersForCompanies(companyIds);

    const ordersInDateRange = orders.filter(order => {
        const orderDate = new Date(order.createdAt as string);
        return orderDate >= startOfDay(from) && orderDate <= endOfDay(to);
    });

    const completedOrders = ordersInDateRange.filter(o => o.status === 'completed');

    const netRevenue = completedOrders.reduce((sum, order) => sum + order.total, 0);
    const totalCosts = completedOrders.reduce((sum, order) => sum + order.items.reduce((itemSum, item) => itemSum + (item.costPrice || 0) * item.quantity, 0), 0);
    const grossProfit = netRevenue - totalCosts;
    const totalOrders = completedOrders.length;
    const averageTicket = totalOrders > 0 ? netRevenue / totalOrders : 0;

    // Prepare data for charting
    const revenueByPeriod: { [key: string]: number } = {};
    const days = eachDayOfInterval({ start: from, end: to });
    const dateFormat = differenceInDays(to, from) > 31 ? 'MM/yy' : 'dd/MM';

    days.forEach(day => {
        revenueByPeriod[format(day, dateFormat)] = 0;
    });

    completedOrders.forEach(order => {
        const dateStr = format(new Date(order.createdAt as string), dateFormat);
        if (revenueByPeriod.hasOwnProperty(dateStr)) {
            revenueByPeriod[dateStr] += order.total;
        }
    });

    const revenueChartData = Object.entries(revenueByPeriod).map(([period, total]) => ({
        period,
        total,
    }));


    return {
        netRevenue,
        totalCosts,
        grossProfit,
        averageTicket,
        totalOrders,
        revenueByPeriod: revenueChartData,
    };
}
