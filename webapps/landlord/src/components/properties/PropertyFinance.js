import { Card } from '../ui/card';
import { LuTrendingDown, LuTrendingUp, LuUpload } from 'react-icons/lu';
import { Button } from '../ui/button';
import useTranslation from 'next-translate/useTranslation';
import NumberFormat from '../NumberFormat';
import { useContext, useEffect, useState } from 'react';
import { StoreContext } from '../../store';

export default function PropertyFinance({ property }) {
  const { t } = useTranslation('common');
  const store = useContext(StoreContext);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      const { status, data } = await store.property.fetchFinance(property._id);
      if (status === 200) {
        setData(data);
      }
      setLoading(false);
    }
    init();
  }, [store.property, property._id]);

  if (loading) return <div className="p-8 text-center italic text-muted-foreground">{t('Loading financial data...')}</div>;

  const finance = data || {};
  const monthlyInterest = finance.monthlyInterest || 0;
  const netRent = finance.netRent || 0;
  const negativeGearingImpact = finance.negativeGearingImpact || 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 bg-blue-50/50 dark:bg-blue-900/10">
          <div className="flex items-center gap-2 text-blue-600 mb-2">
            <LuTrendingDown size={20} />
            <span className="font-semibold">{t('Monthly Interest')}</span>
          </div>
          <div className="text-2xl font-bold italic">
            <NumberFormat value={monthlyInterest} />
          </div>
        </Card>

        <Card className="p-4 bg-green-50/50 dark:bg-green-900/10">
          <div className="flex items-center gap-2 text-green-600 mb-2">
            <LuTrendingUp size={20} />
            <span className="font-semibold">{t('Monthly Rent')}</span>
          </div>
          <div className="text-2xl font-bold italic">
            <NumberFormat value={netRent} />
          </div>
        </Card>

        <Card className={`p-4 ${negativeGearingImpact > 0 ? 'bg-orange-50/50 dark:bg-orange-900/10' : 'bg-gray-50/50'}`}>
          <div className="flex items-center gap-2 text-orange-600 mb-2">
            <LuTrendingDown size={20} />
            <span className="font-semibold">{t('Negative Gearing Impact')}</span>
          </div>
          <div className="text-2xl font-bold italic">
            <NumberFormat value={Math.max(0, negativeGearingImpact)} />
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">{t('Bank Reconciliation')}</h3>
          <Button variant="outline" className="gap-2">
            <LuUpload size={16} />
            {t('Upload CSV')}
          </Button>
        </div>
        
        <div className="text-muted-foreground text-sm space-y-2">
          <p>{t('Configured Keywords:')}</p>
          <div className="flex flex-wrap gap-2">
            {(property.financialConfigs?.incomeKeywords || []).map(k => (
              <span key={k} className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded text-xs">
                {k}
              </span>
            ))}
            {(property.financialConfigs?.expenseKeywords || []).map(k => (
              <span key={k} className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded text-xs">
                {k}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-6 border rounded-lg p-8 text-center text-muted-foreground italic">
          {t('Upload a bank statement to see reconciled transactions.')}
        </div>
      </Card>
    </div>
  );
}
