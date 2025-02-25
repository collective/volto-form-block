import { defineMessages } from 'react-intl';
import loadable from '@loadable/component';
import formSVG from '@plone/volto/icons/form.svg';

import {
  submitForm,
  getFormData,
  exportCsvFormData,
  clearFormData,
  sendOTP,
} from 'volto-form-block/reducers';

import { schemaFormBlockSchema } from 'volto-form-block/components/schema';
import schemaFormBlockEdit from 'volto-form-block/components/EditSchemaForm';
import schemaFormBlockView from 'volto-form-block/components/ViewSchemaForm';

import HoneypotCaptchaWidget from 'volto-form-block/components/Widgets/HoneypotCaptchaWidget';
import NorobotsCaptchaWidget from 'volto-form-block/components/Widgets/NorobotsCaptchaWidget';
import GoogleReCaptchaWidget from 'volto-form-block/components/Widgets/GoogleReCaptchaWidget';

export {
  submitForm,
  getFormData,
  exportCsvFormData,
  sendOTP,
} from 'volto-form-block/actions';

defineMessages({
  textarea: {
    id: 'textarea',
    defaultMessage: 'Textarea',
  },
  radio_group: {
    id: 'radio_group',
    defaultMessage: 'Radio Group',
  },
  checkbox_group: {
    id: 'checkbox_group',
    defaultMessage: 'Checkbox Group',
  },
  hidden: {
    id: 'hidden',
    defaultMessage: 'Hidden',
  },
  static_text: {
    id: 'static_text',
    defaultMessage: 'Static Text',
  },
  number: {
    id: 'number',
    defaultMessage: 'Number',
  },
  time: {
    id: 'time',
    defaultMessage: 'Time',
  },
});

const applyConfig = (config) => {
  config.widgets.widget.honeypot = HoneypotCaptchaWidget;
  config.widgets.widget['norobots-captcha'] = NorobotsCaptchaWidget;
  config.widgets.widget['recaptcha'] = GoogleReCaptchaWidget;

  config.blocks.blocksConfig = {
    ...config.blocks.blocksConfig,
    schemaForm: {
      id: 'schemaForm',
      title: 'Form',
      icon: formSVG,
      group: 'text',
      view: schemaFormBlockView,
      edit: schemaFormBlockEdit,
      widgets: null,
      component: null,
      buttonComponent: null,
      blockSchema: schemaFormBlockSchema,
      captchaProvidersVocabulary:
        'collective.volto.formsupport.captcha.providers',
      mailTemplatesVocabulary: 'collective.volto.formsupport.mail.templates',
      disableEnter: true,
      filterFactory: [
        'label_text_field',
        'label_choice_field',
        'label_boolean_field',
        'label_date_field',
        'label_datetime_field',
        'File Upload',
        'label_email',
        'radio_group',
        'checkbox_group',
        'hidden',
        'static_text',
        'number',
        'textarea',
        'time',
      ],
      additionalFactory: [
        { value: 'textarea', label: 'Textarea' },
        { value: 'radio_group', label: 'Radio Group' },
        { value: 'checkbox_group', label: 'Checkbox Group' },
        { value: 'hidden', label: 'Hidden' },
        { value: 'static_text', label: 'Static Text' },
        { value: 'number', label: 'Number' },
        { value: 'time', label: 'Time' },
      ],
      filterFactorySend: ['static_text'],
      defaultSender: 'noreply@plone.org',
      defaultSenderName: 'Plone',
      restricted: false,
      mostUsed: true,
      security: {
        addPermission: [],
        view: [],
      },
      sidebarTab: 1,
    },
  };

  config.addonReducers = {
    ...config.addonReducers,
    submitForm,
    formData: getFormData,
    exportCsvFormData,
    clearFormData,
    sendOTP,
  };

  config.settings.loadables['HCaptcha'] = loadable(
    () => import('@hcaptcha/react-hcaptcha'),
  );
  config.settings.loadables['GoogleReCaptcha'] = loadable.lib(
    () => import('react-google-recaptcha-v3'),
  );

  return config;
};

export default applyConfig;
