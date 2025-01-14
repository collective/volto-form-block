import loadable from '@loadable/component';

/*--------------------------------
--- BOUNDLE VoltoFormBlockView ---
---------------------------------*/
export const View = loadable(() =>
  import(
    /* webpackChunkName: "VoltoFormBlockView" */ 'volto-form-block/components/View'
  ),
);
export const FormView = loadable(() =>
  import(
    /* webpackChunkName: "VoltoFormBlockView" */ 'volto-form-block/components/FormView'
  ),
);
export const FormResult = loadable(() =>
  import(
    /* webpackChunkName: "VoltoFormBlockView" */ 'volto-form-block/components/FormResult'
  ),
);
export const Field = loadable(() =>
  import(
    /* webpackChunkName: "VoltoFormBlockView" */ 'volto-form-block/components/Field'
  ),
);

/*--------------------------------
--- BOUNDLE VoltoFormBlockEdit ---
---------------------------------*/
export const Edit = loadable(() =>
  import(
    /* webpackChunkName: "VoltoFormBlockEdit" */ 'volto-form-block/components/Edit'
  ),
);
export const Sidebar = loadable(() =>
  import(
    /* webpackChunkName: "VoltoFormBlockEdit" */ 'volto-form-block/components/Sidebar'
  ),
);
export const EditBlock = loadable(() =>
  import(
    /* webpackChunkName: "VoltoFormBlockEdit" */ 'volto-form-block/components/EditBlock'
  ),
);
