'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const PAYMENT_METHODS = [
  { id: 'bkash', name: 'Bkash', currency: 'BDT', color: '#E2136E' },
  { id: 'nagad', name: 'Nagad', currency: 'BDT', color: '#FF6B6B' },
  { id: 'rocket', name: 'Rocket', currency: 'BDT', color: '#4CAF50' },
  { id: 'binance', name: 'Binance', currency: 'USD', color: '#F0B90B' },
  { id: 'cash', name: 'Cash', currency: 'BDT', color: '#2196F3' },
];

export default function FinancialManagementPage() {
  const [transactions, setTransactions] = useState<Array<{
    id: string;
    date: string;
    amount: number;
    paymentMethod: string;
    description: string;
    type: 'income' | 'expense';
  }>>([]);

  const [newTransaction, setNewTransaction] = useState({
    amount: '',
    paymentMethod: '',
    description: '',
    type: 'income',
    date: format(new Date(), 'yyyy-MM-dd'),
  });

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'daily' | 'monthly'>('daily');

  const handleAddTransaction = () => {
    if (!newTransaction.amount || !newTransaction.paymentMethod) return;

    const transaction = {
      id: Date.now().toString(),
      date: newTransaction.date,
      amount: parseFloat(newTransaction.amount),
      paymentMethod: newTransaction.paymentMethod,
      description: newTransaction.description,
      type: newTransaction.type as 'income' | 'expense',
    };

    setTransactions([...transactions, transaction]);
    setNewTransaction({
      amount: '',
      paymentMethod: '',
      description: '',
      type: 'income',
      date: format(new Date(), 'yyyy-MM-dd'),
    });
  };

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const netProfit = totalIncome - totalExpenses;

  // Calculate daily income and expenses for the selected month
  const monthStart = startOfMonth(selectedDate);
  const monthEnd = endOfMonth(selectedDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const dailyData = daysInMonth.map(day => {
    const dayTransactions = transactions.filter(t => t.date === format(day, 'yyyy-MM-dd'));
    const dayIncome = dayTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const dayExpenses = dayTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    return {
      date: format(day, 'yyyy-MM-dd'),
      income: dayIncome,
      expenses: dayExpenses,
    };
  });

  // Calculate payment method distribution
  const paymentMethodDistribution = PAYMENT_METHODS.map(method => {
    const methodTransactions = transactions.filter(t => t.paymentMethod === method.id);
    const total = methodTransactions.reduce((sum, t) => sum + t.amount, 0);
    return {
      ...method,
      total,
      percentage: (total / (totalIncome + totalExpenses)) * 100,
    };
  });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Financial Management</h1>
        <div className="flex gap-4">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2">
                <CalendarIcon className="h-4 w-4" />
                {format(selectedDate, 'MMMM yyyy')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <Select value={viewMode} onValueChange={(value: 'daily' | 'monthly') => setViewMode(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select view" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily View</SelectItem>
              <SelectItem value="monthly">Monthly View</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="animate-in fade-in slide-in-from-left duration-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              Total Income
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">৳{totalIncome.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground mt-1">This month's total income</p>
          </CardContent>
        </Card>
        
        <Card className="animate-in fade-in slide-in-from-bottom duration-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-red-500" />
              Total Expenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">৳{totalExpenses.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground mt-1">This month's total expenses</p>
          </CardContent>
        </Card>
        
        <Card className="animate-in fade-in slide-in-from-right duration-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-blue-500" />
              Net Profit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={cn(
              "text-2xl font-bold",
              netProfit >= 0 ? "text-green-600" : "text-red-600"
            )}>
              ৳{netProfit.toLocaleString()}
            </p>
            <p className="text-sm text-muted-foreground mt-1">Current month's net profit</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Add New Transaction</CardTitle>
            <CardDescription>Record a new income or expense</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium">Amount</label>
                  <Input
                    type="number"
                    value={newTransaction.amount}
                    onChange={(e) => setNewTransaction({ ...newTransaction, amount: e.target.value })}
                    placeholder="Enter amount"
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Date</label>
                  <Input
                    type="date"
                    value={newTransaction.date}
                    onChange={(e) => setNewTransaction({ ...newTransaction, date: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium">Payment Method</label>
                  <Select
                    value={newTransaction.paymentMethod}
                    onValueChange={(value) => setNewTransaction({ ...newTransaction, paymentMethod: value })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                    <SelectContent>
                      {PAYMENT_METHODS.map((method) => (
                        <SelectItem key={method.id} value={method.id}>
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: method.color }}
                            />
                            {method.name} ({method.currency})
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Type</label>
                  <Select
                    value={newTransaction.type}
                    onValueChange={(value) => setNewTransaction({ ...newTransaction, type: value })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="income">Income</SelectItem>
                      <SelectItem value="expense">Expense</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium">Description</label>
                <Input
                  value={newTransaction.description}
                  onChange={(e) => setNewTransaction({ ...newTransaction, description: e.target.value })}
                  placeholder="Enter description"
                  className="mt-1"
                />
              </div>
              
              <Button 
                className="w-full"
                onClick={handleAddTransaction}
              >
                Add Transaction
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment Method Distribution</CardTitle>
            <CardDescription>Breakdown of transactions by payment method</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {paymentMethodDistribution.map((method) => (
                <div key={method.id} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: method.color }}
                      />
                      <span className="font-medium">{method.name}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      ৳{method.total.toLocaleString()}
                    </span>
                  </div>
                  <Progress value={method.percentage} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>View all your transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Payment Method</TableHead>
                <TableHead>Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((transaction) => (
                <TableRow key={transaction.id} className="animate-in fade-in slide-in-from-bottom duration-300">
                  <TableCell>{format(new Date(transaction.date), 'MMM dd, yyyy')}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {transaction.type === 'income' ? (
                        <ArrowUpRight className="h-4 w-4 text-green-500" />
                      ) : (
                        <ArrowDownRight className="h-4 w-4 text-red-500" />
                      )}
                      <span className={cn(
                        "font-medium",
                        transaction.type === 'income' ? "text-green-600" : "text-red-600"
                      )}>
                        {transaction.type === 'income' ? 'Income' : 'Expense'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    ৳{transaction.amount.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ 
                          backgroundColor: PAYMENT_METHODS.find(m => m.id === transaction.paymentMethod)?.color 
                        }}
                      />
                      {PAYMENT_METHODS.find(m => m.id === transaction.paymentMethod)?.name}
                    </div>
                  </TableCell>
                  <TableCell>{transaction.description}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
} 