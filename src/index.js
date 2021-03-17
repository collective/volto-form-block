import formSVG from '@plone/volto/icons/form.svg';
import View from './components/View';
import Edit from './components/Edit';
import FormView from './components/FormView';
import Sidebar from './components/Sidebar';
import EditBlock from './components/EditBlock';
import Field from './components/Field';
import { downloadFile, getFieldName } from './components/utils';
import {
  submitForm,
  getFormData,
  exportCsvFormData,
  clearFormData,
} from './reducers';
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
  downloadFile,
  getFieldName,
};
