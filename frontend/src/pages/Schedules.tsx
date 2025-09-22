import React, { useEffect, useState } from 'react';
import { Typography, Table, Tag, Space, Button, Tooltip, message, Spin } from 'antd';
import { 
  PlayCircleOutlined, 
  PauseCircleOutlined, 
  PlusOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import scheduleApi, { ScheduleResponse } from '../services/scheduleApi';

const { Title } = Typography;

const formatDateTime = (iso?: string | null) => (iso ? new Date(iso).toLocaleString() : null);

const Schedules: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(true);
  const [rows, setRows] = useState<ScheduleResponse[]>([]);

  const fetchSchedules = async (): Promise<void> => {
    try {
      setLoading(true);
      const res = await scheduleApi.getAllSchedules();
      if (res.success) {
        setRows(res.data || []);
      } else {
        message.error(res.message || 'Failed to load schedules');
      }
    } catch (e) {
      console.error('Failed to fetch schedules:', e);
      message.error('Failed to load schedules');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  const toHumanCron = (expr?: string): string | null => {
    if (!expr) return null;
    const parts = expr.trim().split(/\s+/);
    if (parts.length !== 6) return expr;
    const [sec, min, hour, day, month, weekday] = parts;

    // Every N minutes
    if ((sec === '0' || sec === '*') && /^\*\/(\d+)$/.test(min) && hour === '*' && day === '*' && month === '*' && weekday === '*') {
      const n = min.split('/')[1];
      return `Every ${n} minute${n === '1' ? '' : 's'}`;
    }
    // Every hour
    if ((sec === '0' || sec === '*') && (min === '0' || min === '*') && hour === '*' && day === '*' && month === '*' && weekday === '*') {
      if (min === '0') return 'Every hour';
    }
    // Every N hours
    if ((sec === '0' || sec === '*') && (min === '0' || min === '*') && /^\*\/(\d+)$/.test(hour) && day === '*' && month === '*' && weekday === '*') {
      const n = hour.split('/')[1];
      return `Every ${n} hour${n === '1' ? '' : 's'}`;
    }
    // Daily at HH:MM
    if ((sec === '0' || sec === '*') && /^\d+$/.test(min) && /^\d+$/.test(hour) && day === '*' && month === '*' && weekday === '*') {
      const hh = hour.padStart(2, '0');
      const mm = min.padStart(2, '0');
      return `Daily at ${hh}:${mm}`;
    }
    // Weekly on weekday at HH:MM (weekday 0-6, 0=Sun per many crons)
    if ((sec === '0' || sec === '*') && /^\d+$/.test(min) && /^\d+$/.test(hour) && day === '*' && month === '*' && /^\d$/.test(weekday)) {
      const days: Record<string, string> = { '0': 'Sunday', '1': 'Monday', '2': 'Tuesday', '3': 'Wednesday', '4': 'Thursday', '5': 'Friday', '6': 'Saturday' };
      const hh = hour.padStart(2, '0');
      const mm = min.padStart(2, '0');
      return `Every ${days[weekday]} at ${hh}:${mm}`;
    }
    // Monthly on day X at HH:MM
    if ((sec === '0' || sec === '*') && /^\d+$/.test(min) && /^\d+$/.test(hour) && /^\d+$/.test(day) && month === '*' && weekday === '*') {
      const hh = hour.padStart(2, '0');
      const mm = min.padStart(2, '0');
      return `Monthly on day ${day} at ${hh}:${mm}`;
    }
    return expr;
  };

  const pauseOrResume = async (record: ScheduleResponse): Promise<void> => {
    try {
      const updated = await scheduleApi.updateSchedule(record.id, { enabled: !record.enabled } as any);
      if (updated.success) {
        message.success(record.enabled ? 'Schedule paused' : 'Schedule resumed');
        fetchSchedules();
      } else {
        message.error(updated.message || 'Failed to update schedule');
      }
    } catch (e) {
      console.error('Failed to update schedule:', e);
      message.error('Failed to update schedule');
    }
  };

  // deleteSchedule removed per UI simplification

  const columns = [
    {
      title: 'Name',
      key: 'name',
      render: (_: any, record: ScheduleResponse) => {
        const reqName = (record as any).apiRequest?.name;
        const name = reqName || (record.apiRequestId ? `Request #${record.apiRequestId}`
          : record.apiSourceId ? `Source #${record.apiSourceId}`
          : record.destinationId ? `Destination #${record.destinationId}`
          : `Schedule #${record.id}`);
        return <span>{name}</span>;
      },
    },
    {
      title: 'Destination',
      key: 'destination',
      render: (_: any, record: ScheduleResponse) => record.destinationId ?? '-',
    },
    {
      title: 'Schedule',
      key: 'schedule',
      render: (_: any, record: ScheduleResponse) => (
        <code>{record.scheduleType === 'cron' ? (record.cronDescription || toHumanCron(record.cronExpression) || 'CRON') : 'Manual'}</code>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      render: (_: any, record: ScheduleResponse) => {
        const isPaused = !record.enabled;
        const color = isPaused ? 'warning' : 'success';
        const text = isPaused ? 'PAUSED' : 'ACTIVE';
        return <Tag color={color}>{text}</Tag>;
      },
      filters: [
        { text: 'Active', value: 'active' },
        { text: 'Paused', value: 'paused' },
      ],
      onFilter: (value: any, record: ScheduleResponse) => (value === 'active' ? record.enabled : !record.enabled),
    },
    {
      title: 'Last Run',
      key: 'lastRun',
      render: (_: any, record: ScheduleResponse) => formatDateTime((record as any).lastExecutedAt) || 'Never',
    },
    {
      title: 'Next Run',
      key: 'nextRun',
      render: (_: any, record: ScheduleResponse) => formatDateTime((record as any).nextExecutionAt) || 'Not scheduled',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: ScheduleResponse) => (
        <Space size="middle">
          <Tooltip title={record.enabled ? 'Pause' : 'Activate'}>
            <Button 
              type="text" 
              icon={record.enabled ? <PauseCircleOutlined /> : <PlayCircleOutlined />} 
              onClick={() => pauseOrResume(record)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4}>Scheduled Jobs</Title>
    
      </div>
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Spin size="large" />
        </div>
      ) : (
        <Table 
          columns={columns} 
          dataSource={rows}
          rowKey="id"
        />
      )}
    </div>
  );
};

export default Schedules;
