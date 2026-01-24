import { Card } from '../ui/card';
import { LuFileText, LuImage } from 'react-icons/lu';
import useTranslation from 'next-translate/useTranslation';
import moment from 'moment';
import { useContext, useEffect, useState } from 'react';
import { StoreContext } from '../../store';

export default function PropertyDocuments({ property }) {
  const { t } = useTranslation('common');
  const store = useContext(StoreContext);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      const { status, data } = await store.property.fetchDocuments(property._id);
      if (status === 200) {
        setDocuments(data || []);
      }
      setLoading(false);
    }
    init();
  }, [store.property, property._id]);

  if (loading) return <div className="p-8 text-center italic text-muted-foreground">{t('Loading document gallery...')}</div>;

  if (!property.localFolderPath) {
    return (
      <Card className="p-8 text-center text-muted-foreground italic">
        {t('Set up a local folder path in the Property tab to sync documents and photos.')}
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">{t('Chronological Gallery & Docs')}</h3>
        <span className="text-xs text-muted-foreground italic">{t('Syncing from: {{path}}', { path: property.localFolderPath })}</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {documents.filter(d => d.type === 'image').map((img) => (
          <div key={img.id} className="group relative aspect-square overflow-hidden rounded-lg bg-gray-100 hover:ring-2 hover:ring-blue-500 transition-all">
            <img 
              src={img.url} 
              alt={img.name} 
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-x-0 bottom-0 bg-black/60 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <p className="text-[10px] text-white truncate">{img.name}</p>
              <p className="text-[8px] text-gray-300">{moment(img.date).format('ll')}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 space-y-2">
        <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{t('Files')}</h4>
        {documents.filter(d => d.type !== 'image').map((file) => (
          <div key={file.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
            <LuFileText className="text-red-500" size={24} />
            <div className="flex-1">
              <div className="text-sm font-medium">{file.name}</div>
              <div className="text-xs text-muted-foreground">{file.size} • {moment(file.date).format('ll')}</div>
            </div>
            <button className="text-xs text-blue-500 hover:underline">{t('View')}</button>
          </div>
        ))}
      </div>
    </div>
  );
}
