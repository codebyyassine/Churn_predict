# Frontend Implementation Guide - Risk Monitoring & Alerts

## PR Summary
This PR introduces new features for customer churn risk monitoring and Discord alerts:
1. Alert configuration management
2. Alert history tracking
3. Alert statistics dashboard
4. Risk monitoring dashboard

## New Components Required

### 1. Alert Configuration Form
```typescript
interface AlertConfig {
    webhook_url: string;
    is_enabled: boolean;
    high_risk_threshold: number;
    risk_increase_threshold: number;
}

// Example component structure
const AlertConfigForm: React.FC = () => {
    const [config, setConfig] = useState<AlertConfig>();
    
    const fetchConfig = async () => {
        const response = await api.get('/api/alerts/config/');
        setConfig(response.data);
    };
    
    const updateConfig = async (values: AlertConfig) => {
        await api.post('/api/alerts/config/', values);
        fetchConfig();
    };
    
    return (
        <Form
            initialValues={config}
            onSubmit={updateConfig}
        >
            <Input name="webhook_url" label="Discord Webhook URL" />
            <Switch name="is_enabled" label="Enable Alerts" />
            <NumberInput 
                name="high_risk_threshold" 
                label="High Risk Threshold"
                min={0}
                max={1}
                step={0.1}
            />
            <NumberInput 
                name="risk_increase_threshold" 
                label="Risk Increase Threshold (%)"
                min={0}
                max={100}
                step={5}
            />
        </Form>
    );
};
```

### 2. Alert History Table
```typescript
interface AlertHistory {
    id: number;
    customer: number;
    customer_name: string;
    alert_type: 'HIGH_RISK' | 'RISK_INCREASE' | 'SUMMARY';
    message: any;
    sent_at: string;
    was_sent: boolean;
    error_message: string | null;
}

// Example component structure
const AlertHistoryTable: React.FC = () => {
    const [filters, setFilters] = useState({
        alert_type: '',
        customer_id: '',
        date_from: '',
        date_to: '',
        success_only: false
    });
    
    const fetchAlerts = async (page = 1) => {
        const params = new URLSearchParams({
            ...filters,
            page: String(page)
        });
        
        const response = await api.get(`/api/alerts/history/?${params}`);
        return response.data;
    };
    
    return (
        <div>
            <FilterForm value={filters} onChange={setFilters} />
            <Table
                columns={[
                    { title: 'Customer', key: 'customer_name' },
                    { title: 'Type', key: 'alert_type' },
                    { title: 'Sent At', key: 'sent_at' },
                    { title: 'Status', key: 'was_sent' }
                ]}
                dataSource={alerts}
                pagination={true}
            />
        </div>
    );
};
```

### 3. Risk Dashboard
```typescript
interface RiskDashboardData {
    high_risk_customers: Array<{
        customer_id: number;
        customer_name: string;
        probability: number;
        risk_change: number;
        last_updated: string;
    }>;
    significant_increases: Array<{
        customer_id: number;
        customer_name: string;
        probability: number;
        risk_change: number;
        previous_probability: number;
        changed_at: string;
    }>;
    risk_distribution: {
        very_high: number;
        high: number;
        medium: number;
        low: number;
        very_low: number;
    };
    risk_trend: Array<{
        date: string;
        avg_risk: number;
        high_risk_count: number;
    }>;
    thresholds: {
        high_risk: number;
        risk_increase: number;
    };
}

// Example component structure
const RiskDashboard: React.FC = () => {
    const [data, setData] = useState<RiskDashboardData>();
    
    const fetchDashboard = async () => {
        const response = await api.get('/api/risk/dashboard/');
        setData(response.data);
    };
    
    return (
        <DashboardLayout>
            {/* High Risk Customers Card */}
            <Card title="High Risk Customers">
                <Table
                    dataSource={data?.high_risk_customers}
                    columns={[
                        { title: 'Customer', key: 'customer_name' },
                        { title: 'Risk Score', key: 'probability' },
                        { title: 'Change', key: 'risk_change' }
                    ]}
                />
            </Card>
            
            {/* Risk Distribution Chart */}
            <Card title="Risk Distribution">
                <PieChart data={data?.risk_distribution} />
            </Card>
            
            {/* Risk Trend Chart */}
            <Card title="30-Day Risk Trend">
                <LineChart 
                    data={data?.risk_trend}
                    xKey="date"
                    yKey="avg_risk"
                    secondaryYKey="high_risk_count"
                />
            </Card>
        </DashboardLayout>
    );
};
```

### 4. Manual Monitoring Trigger
```typescript
// services/risk.ts
export const riskService = {
    getDashboard: () => api.get('/api/risk/dashboard/'),
    triggerMonitoring: () => api.post('/api/risk/monitor/trigger/'),
};

// Example component
const MonitoringControls: React.FC = () => {
    const [isRunning, setIsRunning] = useState(false);
    const [lastRun, setLastRun] = useState<string | null>(null);
    
    const handleTriggerMonitoring = async () => {
        try {
            setIsRunning(true);
            const response = await riskService.triggerMonitoring();
            
            if (response.data.status === 'success') {
                notification.success({
                    message: 'Monitoring Complete',
                    description: response.data.message
                });
                setLastRun(new Date().toISOString());
            } else {
                notification.error({
                    message: 'Monitoring Failed',
                    description: response.data.message
                });
            }
        } catch (error) {
            notification.error({
                message: 'Error',
                description: 'Failed to trigger monitoring. Please try again.'
            });
        } finally {
            setIsRunning(false);
        }
    };
    
    return (
        <Card title="Monitoring Controls">
            <Space direction="vertical">
                <Button 
                    type="primary"
                    onClick={handleTriggerMonitoring}
                    loading={isRunning}
                    icon={<SyncOutlined />}
                >
                    Run Monitoring Now
                </Button>
                
                {lastRun && (
                    <Text type="secondary">
                        Last run: {formatDateTime(lastRun)}
                    </Text>
                )}
            </Space>
        </Card>
    );
};

// Add to RiskDashboard component
const RiskDashboard: React.FC = () => {
    // ... existing code ...
    
    return (
        <DashboardLayout>
            <Row gutter={[16, 16]}>
                <Col span={24}>
                    <MonitoringControls />
                </Col>
                
                {/* Existing dashboard cards */}
                <Col span={24}>
                    <Card title="High Risk Customers">
                        {/* ... */}
                    </Card>
                </Col>
                
                {/* ... other cards ... */}
            </Row>
        </DashboardLayout>
    );
};
```

## Implementation Steps

1. **Add New Routes**
```typescript
// routes.ts
export const routes = {
    // ... existing routes
    alerts: {
        config: '/alerts/config',
        history: '/alerts/history',
        stats: '/alerts/stats'
    },
    risk: {
        dashboard: '/risk/dashboard'
    }
};
```

2. **Add API Services**
```typescript
// services/alerts.ts
export const alertsService = {
    getConfig: () => api.get('/api/alerts/config/'),
    updateConfig: (data: AlertConfig) => api.post('/api/alerts/config/', data),
    getHistory: (params: AlertHistoryFilters) => api.get('/api/alerts/history/', { params }),
    getStats: () => api.get('/api/alerts/stats/')
};

// services/risk.ts
export const riskService = {
    getDashboard: () => api.get('/api/risk/dashboard/'),
    triggerMonitoring: () => api.post('/api/risk/monitor/trigger/')
};
```

3. **Add to Navigation**
```typescript
const navItems = [
    // ... existing items
    {
        key: 'risk-monitoring',
        label: 'Risk Monitoring',
        children: [
            { key: 'dashboard', label: 'Dashboard', path: routes.risk.dashboard },
            { key: 'alerts', label: 'Alerts', path: routes.alerts.history }
        ]
    }
];
```

## Testing Checklist

1. Alert Configuration:
   - [ ] Can view current configuration
   - [ ] Can update webhook URL
   - [ ] Can enable/disable alerts
   - [ ] Can adjust risk thresholds

2. Alert History:
   - [ ] Can view alert history
   - [ ] Can filter by type
   - [ ] Can filter by date range
   - [ ] Can filter by customer
   - [ ] Pagination works

3. Risk Dashboard:
   - [ ] High risk customers table loads
   - [ ] Risk distribution chart displays
   - [ ] Risk trend chart shows 30-day data
   - [ ] Auto-refresh works (if implemented)

4. Manual Monitoring:
   - [ ] Can trigger monitoring manually
   - [ ] Shows loading state while running
   - [ ] Displays success/error notifications
   - [ ] Updates dashboard after completion
   - [ ] Shows last run timestamp

## Notes

1. All endpoints require admin authentication
2. Use error boundaries for API error handling
3. Implement loading states for all data fetching
4. Consider implementing real-time updates using WebSocket for the dashboard
5. Ensure responsive design for all new components
6. Manual monitoring should be rate-limited to prevent overload
7. Consider adding a confirmation dialog for manual triggers
8. Implement error retry mechanism for failed monitoring runs 