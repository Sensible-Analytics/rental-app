import * as Yup from 'yup';
import {
  AddressField,
  NumberField,
  SelectField,
  SubmitButton,
  TextField
} from '@microrealestate/commonui/components';
import { Form, Formik } from 'formik';
import { useContext, useMemo } from 'react';
import { observer } from 'mobx-react-lite';
import PropertyIcon from './PropertyIcon';
import { Section } from '../formfields/Section';
import { StoreContext } from '../../store';
import types from './types';
import useTranslation from 'next-translate/useTranslation';

const validationSchema = Yup.object().shape({
  type: Yup.string().required(),
  name: Yup.string().required(),
  description: Yup.string(),
  phone: Yup.string(),
  digicode: Yup.string(),
  address: Yup.object().shape({
    street1: Yup.string(),
    street2: Yup.string(),
    city: Yup.string(),
    zipCode: Yup.string(),
    state: Yup.string(),
    country: Yup.string()
  }),
  rent: Yup.number().min(0).required(),
  managerEmail: Yup.string().email(),
  managerWhatsApp: Yup.string(),
  localFolderPath: Yup.string(),
  financialConfigs: Yup.object().shape({
    loanAmount: Yup.number().min(0),
    interestRate: Yup.number().min(0),
    incomeKeywords: Yup.string(),
    expenseKeywords: Yup.string()
  })
});

const PropertyForm = observer(({ onSubmit }) => {
  const { t } = useTranslation('common');
  const store = useContext(StoreContext);

  const initialValues = useMemo(
    () => ({
      type: store.property.selected?.type || '',
      name: store.property.selected?.name || '',
      description: store.property.selected?.description || '',
      surface: store.property.selected?.surface || '',
      phone: store.property.selected?.phone || '',
      digicode: store.property.selected?.digicode || '',
      address: store.property.selected?.address || {
        street1: '',
        street2: '',
        city: '',
        zipCode: '',
        state: '',
        country: ''
      },
      rent: store.property.selected?.price || '',
      managerEmail: store.property.selected?.managerEmail || '',
      managerWhatsApp: store.property.selected?.managerWhatsApp || '',
      localFolderPath: store.property.selected?.localFolderPath || '',
      financialConfigs: {
        loanAmount: store.property.selected?.financialConfigs?.loanAmount || '',
        interestRate: store.property.selected?.financialConfigs?.interestRate || '',
        incomeKeywords: (store.property.selected?.financialConfigs?.incomeKeywords || []).join(', '),
        expenseKeywords: (store.property.selected?.financialConfigs?.expenseKeywords || []).join(', ')
      }
    }),
    [store.property.selected]
  );

  const propertyTypes = useMemo(
    () =>
      types.map((type) => ({
        id: type.id,
        value: type.id,
        label: t(type.labelId),
        renderIcon: () => <PropertyIcon type={type.id} />
      })),
    [t]
  );

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={onSubmit}
    >
      {({ values, isSubmitting }) => {
        return (
          <Form autoComplete="off">
            <Section label={t('Property information')}>
              <div className="sm:flex sm:gap-2">
                <SelectField
                  label={t('Property Type')}
                  name="type"
                  values={propertyTypes}
                />
                <TextField label={t('Name')} name="name" />
              </div>
              <TextField label={t('Description')} name="description" />

              {[
                'store',
                'building',
                'apartment',
                'room',
                'office',
                'garage'
              ].includes(values.type) && (
                <div className="sm:flex sm:gap-2">
                  <NumberField label={t('Surface')} name="surface" />
                  <TextField label={t('Phone')} name="phone" />
                  <TextField label={t('Digicode')} name="digicode" />
                </div>
              )}
            </Section>
            <Section label={t('Address')}>
              <AddressField />
            </Section>
            <Section label={t('Integrations')}>
              <div className="sm:flex sm:gap-2">
                <TextField label={t('Manager/Tenant Email')} name="managerEmail" />
                <TextField label={t('WhatsApp Number')} name="managerWhatsApp" />
              </div>
              <TextField label={t('Local Folder Path')} name="localFolderPath" />
            </Section>
            <Section label={t('Financing & Reconciliation')}>
              <div className="sm:flex sm:gap-2">
                <NumberField label={t('Loan Amount')} name="financialConfigs.loanAmount" />
                <NumberField label={t('Interest Rate (%)')} name="financialConfigs.interestRate" />
              </div>
              <TextField
                label={t('Income Keywords (comma-separated)')}
                name="financialConfigs.incomeKeywords"
                placeholder="RENT, COOPER"
              />
              <TextField
                label={t('Expense Keywords (comma-separated)')}
                name="financialConfigs.expenseKeywords"
                placeholder="INTEREST, WESTPAC"
              />
            </Section>
            <SubmitButton
              size="large"
              label={!isSubmitting ? t('Save') : t('Saving')}
            />
          </Form>
        );
      }}
    </Formik>
  );
});

export default PropertyForm;
