import formSVG from '@plone/volto/icons/form.svg';
import FormView from './components/View';
import FormEdit from './components/Edit';
import {
  submitForm,
  getFormData,
  exportCsvFormData,
  clearFormData,
} from './reducers';

const applyConfig = (config) => {
  config.blocks.blocksConfig = {
    ...config.blocks.blocksConfig,
    form: {
      id: 'form',
      title: 'Form',
      icon: formSVG,
      group: 'text',
      view: FormView,
      edit: FormEdit,
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
