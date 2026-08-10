
import { MaintenanceRecord, MaintenanceStatus } from './types';

export const calculateMaintenanceStatus = (record: MaintenanceRecord): MaintenanceStatus => {
  if (!record) {
    return {
      hoursRemaining: 0,
      daysRemaining: 0,
      projectedDate: 'N/A',
      priority: 'low',
      progressPercent: 0,
      beltHoursRemaining: 0,
      beltProjectedDate: 'N/A',
      beltProgressPercent: 0
    };
  }

  const nextChangeIndex = Number(record.nextChangeIndex) || 0;
  const currentIndex = Number(record.currentIndex) || 0;
  const lastChangeIndex = Number(record.lastChangeIndex) || 0;
  const dailyHours = Number(record.dailyHours) || 0;
  const nextBeltChangeIndex = Number(record.nextBeltChangeIndex) || (lastChangeIndex + 1000);
  const lastBeltChangeIndex = Number(record.lastBeltChangeIndex) || 0;

  // Logic for Oil Change (Vidange)
  const hoursRemaining = nextChangeIndex - currentIndex;
  const daysRemaining = dailyHours > 0 ? Math.max(0, hoursRemaining / dailyHours) : 0;
  
  const projectedDate = new Date();
  if (!isNaN(daysRemaining) && isFinite(daysRemaining) && daysRemaining > 0) {
    projectedDate.setDate(projectedDate.getDate() + Math.ceil(daysRemaining));
  }

  let priority: 'low' | 'medium' | 'high' = 'low';
  if (hoursRemaining <= 50) priority = 'high';
  else if (hoursRemaining <= 150) priority = 'medium';

  const totalCycle = nextChangeIndex - lastChangeIndex;
  const currentCycleUsed = currentIndex - lastChangeIndex;
  let progressPercent = totalCycle > 0 ? Math.min(100, Math.max(0, (currentCycleUsed / totalCycle) * 100)) : 0;
  if (isNaN(progressPercent) || !isFinite(progressPercent)) progressPercent = 0;

  // Logic for Belt (Courroie) - 1000h cycle
  const beltHoursRemaining = nextBeltChangeIndex - currentIndex;
  const beltDaysRemaining = dailyHours > 0 ? Math.max(0, beltHoursRemaining / dailyHours) : 0;
  
  const beltProjectedDate = new Date();
  if (!isNaN(beltDaysRemaining) && isFinite(beltDaysRemaining) && beltDaysRemaining > 0) {
    beltProjectedDate.setDate(beltProjectedDate.getDate() + Math.ceil(beltDaysRemaining));
  }

  const beltTotalCycle = nextBeltChangeIndex - lastBeltChangeIndex;
  const beltCurrentCycleUsed = currentIndex - lastBeltChangeIndex;
  let beltProgressPercent = beltTotalCycle > 0 ? Math.min(100, Math.max(0, (beltCurrentCycleUsed / beltTotalCycle) * 100)) : 0;
  if (isNaN(beltProgressPercent) || !isFinite(beltProgressPercent)) beltProgressPercent = 0;

  const formatDate = (date: Date) => {
    try {
      if (!date || isNaN(date.getTime())) {
        return 'N/A';
      }
      return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return 'N/A';
    }
  };

  return {
    hoursRemaining: isNaN(hoursRemaining) ? 0 : hoursRemaining,
    daysRemaining: isNaN(daysRemaining) || !isFinite(daysRemaining) ? 0 : daysRemaining,
    projectedDate: formatDate(projectedDate),
    priority,
    progressPercent,
    beltHoursRemaining: isNaN(beltHoursRemaining) ? 0 : beltHoursRemaining,
    beltProjectedDate: formatDate(beltProjectedDate),
    beltProgressPercent
  };
};

export const formatNumber = (num: number | undefined | null) => {
  if (num === undefined || num === null || isNaN(Number(num))) return '0';
  try {
    return new Intl.NumberFormat('fr-FR').format(Number(num));
  } catch {
    return String(num);
  }
};

export const exportToCSV = (data: any[], filename: string) => {
  if (data.length === 0) return;
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(header => `"${row[header]}"`).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};
