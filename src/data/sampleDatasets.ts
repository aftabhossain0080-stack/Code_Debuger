import { SampleDatasetOption } from '../types/dataset';

export const SAMPLE_DATASETS: SampleDatasetOption[] = [
  {
    id: 'customer-churn',
    name: 'Customer Churn & Subscriptions',
    description: '15 rows · 6 cols · Missing values & duplicates included for testing',
    filename: 'telecom_customer_churn.csv',
    csvContent: `customer_id,age,tenure_months,monthly_charges,contract_type,churned
CUST-1001,34,12,65.50,Month-to-month,Yes
CUST-1002,45,24,89.20,One year,No
CUST-1003,29,6,45.00,Month-to-month,Yes
CUST-1004,52,48,110.40,Two year,No
CUST-1005,,18,78.30,Month-to-month,No
CUST-1006,38,,55.00,Month-to-month,Yes
CUST-1007,61,36,95.10,Two year,No
CUST-1008,24,3,39.90,Month-to-month,Yes
CUST-1002,45,24,89.20,One year,No
CUST-1009,41,15,,One year,No
CUST-1010,33,9,59.80,Month-to-month,Yes
CUST-1011,57,60,119.50,Two year,No
CUST-1012,28,4,42.50,Month-to-month,Yes
CUST-1013,49,30,84.70,One year,No
CUST-1008,24,3,39.90,Month-to-month,Yes`,
  },
  {
    id: 'retail-sales',
    name: 'E-Commerce Transactions',
    description: 'Clean retail data with revenue, units, and regional distribution',
    filename: 'retail_sales_q3.csv',
    csvContent: `transaction_id,region,product_category,units_sold,unit_price,total_revenue,discount_applied
TXN-901,North America,Electronics,4,299.99,1199.96,true
TXN-902,Europe,Apparel,12,35.50,426.00,false
TXN-903,Asia Pacific,Home & Kitchen,8,85.00,680.00,true
TXN-904,North America,Electronics,2,649.00,1298.00,false
TXN-905,Latin America,Apparel,25,22.00,550.00,true
TXN-906,Europe,Electronics,5,189.50,947.50,false
TXN-907,North America,Home & Kitchen,10,45.00,450.00,false
TXN-908,Asia Pacific,Apparel,18,29.99,539.82,true
TXN-909,Europe,Home & Kitchen,3,120.00,360.00,false
TXN-910,Latin America,Electronics,7,320.00,2240.00,true
TXN-911,North America,Apparel,15,40.00,600.00,false
TXN-912,Asia Pacific,Electronics,6,450.00,2700.00,true`,
  },
];
