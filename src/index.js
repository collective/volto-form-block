import formSVG from '@plone/volto/icons/form.svg';
import FormView from './components/View';
import FormEdit from './components/Edit';

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

  return config;
};

export default applyConfig;
