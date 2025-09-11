
'use server';

import { getOrdersForCompanies } from './order-service';
import type { Order } from '@/lib/types';
import { eachDayOfInterval, format, startOfDay, endOfDay, differenceInDays } from 'date-fns';

export interface FinancialData {
    netRevenue: number; // Gross Revenue from sales
    totalCosts: number; // Cost of Goods Sold (COGS)
    grossProfit: number; // netRevenue - totalCosts
    totalExpenses: number; // Manually added expenses (marketing, salaries, etc.)
    netProfit: number; // grossProfit - totalExpenses
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
    
    // Placeholder for manually added expenses. In the future, this would be fetched from a 'expenses' collection.
    const totalExpenses = 0; 
    const netProfit = grossProfit - totalExpenses;

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
        totalExpenses,
        netProfit,
        averageTicket,
        totalOrders,
        revenueByPeriod: revenueChartData,
    };
}

    