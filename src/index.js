import loadable from '@loadable/component';
import formSVG from '@plone/volto/icons/form.svg';
import View from './components/View';
import Edit from './components/Edit';
import FormView from './components/FormView';
import Sidebar from './components/Sidebar';
import EditBlock from './components/EditBlock';
import Field from './components/Field';
import GoogleReCaptchaWidget from './components/Widget/GoogleReCaptchaWidget';
import HCaptchaWidget from './components/Widget/HCaptchaWidget';
import { downloadFile, getFieldName } from './components/utils';
import {
  submitForm,
  getFormData,
  exportCsvFormData,
  clearFormData,
} from './reducers';
import FormSchema from './formSchema';
import FieldSchema from './fieldSchema';
import {
  SelectionSchemaExtender,
  FromSchemaExtender,
} from './components/FieldTypeSchemaExtenders';
export { submitForm, getFormData, exportCsvFormData } from './actions';

const applyConfig = (config) => {
  config.blocks.blocksConfig = {
    ...config.blocks.blocksConfig,
    form: {
      id: 'form',
      title: 'Form',
      icon: formSVG,
      group: 'text',
      view: View,
      edit: Edit,
      formSchema: FormSchema,
      fieldSchema: FieldSchema,
      additionalFields: [],
      fieldTypeSchemaExtenders: {
        select: SelectionSchemaExtender,
        single_choice: SelectionSchemaExtender,
        multiple_choice: SelectionSchemaExtender,
        from: FromSchemaExtender,
      },
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
  };

  config.settings.loadables['HCaptcha'] = loadable(() =>
    import('@hcaptcha/react-hcaptcha'),
  );
  config.settings.loadables['GoogleReCaptcha'] = loadable.lib(() =>
    import('react-google-recaptcha-v3'),
  );

  return config;
};

export default applyConfig;
export {
  View,
  Edit,
  Sidebar,
  FormView,
  EditBlock,
  Field,
  GoogleReCaptchaWidget,
  HCaptchaWidget,
  downloadFile,
  getFieldName,
};
