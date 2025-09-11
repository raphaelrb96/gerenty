
'use server';

import { getOrdersForCompanies } from './order-service';
import type { Order } from '@/lib/types';
import { eachDayOfInterval, format, startOfDay, endOfDay, differenceInDays } from 'date-fns';

export interface FinancialData {
    netRevenue: number;
    totalCosts: number;
    grossProfit: number;
    totalExpenses: number; // Placeholder for now
    revenueByPeriod: { period: string, total: number }[];
}

export async function getFinancialData(companyIds: string[], from: Date, to: Date): Promise<FinancialData> {
    const orders = await getOrdersForCompanies(companyIds);

    const completedOrdersInDateRange = orders.filter(order => {
        const orderDate = new Date(order.createdAt as string);
        return order.status === 'completed' && orderDate >= startOfDay(from) && orderDate <= endOfDay(to);
    });

    const netRevenue = completedOrdersInDateRange.reduce((sum, order) => sum + order.total, 0);
    const totalCosts = completedOrdersInDateRange.reduce((sum, order) => {
        const orderCost = order.items.reduce((itemSum, item) => itemSum + (item.costPrice || 0) * item.quantity, 0);
        return sum + orderCost;
    }, 0);
    
    const grossProfit = netRevenue - totalCosts;

    // This will be replaced by data from a new 'expenses' collection in the future.
    const totalExpenses = 0; 

    // Group revenue by period for charting
    const revenueByPeriod: { [key: string]: number } = {};
    const days = eachDayOfInterval({ start: from, end: to });
    
    // Determine date format based on range duration
    const dateFormat = differenceInDays(to, from) > 31 ? 'MMM/yy' : 'dd/MM';

    days.forEach(day => {
        revenueByPeriod[format(day, dateFormat)] = 0;
    });

    completedOrdersInDateRange.forEach(order => {
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
        totalExpenses,
        revenueByPeriod: revenueChartData,
    };
}

    