import { Card } from '../ui/card';
import { LuMail, LuMessageCircle } from 'react-icons/lu';
import useTranslation from 'next-translate/useTranslation';
import moment from 'moment';
import { useContext, useEffect, useState } from 'react';
import { StoreContext } from '../../store';

export default function PropertyCommunication({ property }) {
  const { t } = useTranslation('common');
  const store = useContext(StoreContext);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      const { status, data } = await store.property.fetchCommunication(property._id);
      if (status === 200) {
        setMessages(data || []);
      }
      setLoading(false);
    }
    init();
  }, [store.property, property._id]);

  if (loading) return <div className="p-8 text-center italic text-muted-foreground">{t('Loading communication feed...')}</div>;

  if (!property.managerEmail && !property.managerWhatsApp) {
    return (
      <Card className="p-8 text-center text-muted-foreground italic">
        {t('Set up an email or WhatsApp number in the Property tab to see communications.')}
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {messages.map((msg) => (
        <Card key={msg.id} className="p-4 flex gap-4 items-start">
          <div className={`p-2 rounded-full ${msg.source === 'whatsapp' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
            {msg.source === 'whatsapp' ? <LuMessageCircle size={20} /> : <LuMail size={20} />}
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-center mb-1">
              <span className="font-semibold text-sm">{msg.sender}</span>
              <span className="text-xs text-muted-foreground">{moment(msg.date).fromNow()}</span>
            </div>
            <p className="text-sm italic text-gray-700 dark:text-gray-300">"{msg.content}"</p>
          </div>
        </Card>
      ))}
      <div className="text-center py-4">
        <button className="text-xs text-blue-500 hover:underline">{t('Load older messages')}</button>
      </div>
    </div>
  );
}
