import React, { useState, useEffect } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import { useSelector } from 'react-redux';
import {
  Button,
  Grid,
  Input,
  TextArea,
  Modal,
  ModalHeader,
  ModalContent,
  ModalDescription,
  ModalActions,
  Select,
  Radio,
  Message,
} from 'semantic-ui-react';
import { Icon } from '@plone/volto/components';
import deleteSVG from '@plone/volto/icons/delete.svg';
import addSVG from '@plone/volto/icons/add.svg';
import configSVG from '@plone/volto/icons/configuration.svg';
import {
  ConditionsListOptions,
  checkTypeTextField,
  checkTypeSelectionField,
  checkTypeBooleanField,
  checkTypeDateField,
  createStringFormula,
  checkTypeNumberField,
} from 'volto-form-block/helpers/conditions-list';
import { cloneDeep } from 'lodash';

/* Style */
import 'volto-form-block/components/Widget/VisibilityConditionsWidget.css';

const messages = defineMessages({
  visible_conditions_widget_title: {
    id: 'visible_conditions_widget_title',
    defaultMessage: 'Visible choices if',
  },
  visible_conditions_widget_if: {
    id: 'visible_conditions_widget_if',
    defaultMessage: 'If',
  },
  visible_conditions_widget_and: {
    id: 'visible_conditions_widget_and',
    defaultMessage: 'and',
  },
  visible_conditions_widget_fields: {
    id: 'visible_conditions_widget_fields',
    defaultMessage: 'Select a field',
  },
  visible_conditions_widget_options: {
    id: 'visible_conditions_widget_options',
    defaultMessage: 'Select a condition',
  },
  visible_conditions_widget_add: {
    id: 'visible_conditions_widget_add',
    defaultMessage: 'Add condition',
  },
  visible_conditions_widget_delete: {
    id: 'visible_conditions_widget_delete',
    defaultMessage: 'Delete condition',
  },
  visible_conditions_widget_cancel: {
    id: 'visible_conditions_widget_cancel',
    defaultMessage: 'Cancel',
  },
  visible_conditions_widget_apply: {
    id: 'visible_conditions_widget_apply',
    defaultMessage: 'Apply',
  },
  visible_conditions_widget_text: {
    id: 'visible_conditions_widget_text',
    defaultMessage: 'Write text',
  },
  visible_conditions_widget_true: {
    id: 'visible_conditions_widget_true',
    defaultMessage: 'Checked',
  },
  visible_conditions_widget_false: {
    id: 'visible_conditions_widget_false',
    defaultMessage: 'Not checked',
  },
  visible_conditions_widget_not_satisfied: {
    id: 'visible_conditions_widget_not_satisfied',
    defaultMessage:
      'For this field it is not the best solution, we recommend changing the condition.',
  },
});

const VisibilityConditionsWidget = (props) => {
  const { onChange, value = [] } = props;
  const intl = useIntl();
  const initialCondition = {
    field: null,
    field_id: null,
    condition: null,
    value_condition: null,
  };

  const [showModalChoices, setShowModalChoices] = useState(false);

  // Store conditions
  const [conditions, setConditions] = useState([initialCondition]);

  // Options for select Fields
  const optionsFieldsID = useSelector((state) => state?.subblocksIDList);

  // Delete condition button
  const deleteCondition = (index) => {
    let newValues = cloneDeep(conditions);
    if (index >= 0 && index < newValues.length) {
      // remove fields
      newValues.splice(index, 1);
    } else if (index === 0 && newValues.length === 1) {
      // clear fields
      newValues[0].field = null;
      newValues[0].field_id = null;
      newValues[0].condition = null;
      newValues[0].value_condition = null;
    }
    setConditions(newValues);
  };

  // Add condition button
  const addCondition = () => {
    let newValues = cloneDeep(conditions);
    let newItem = initialCondition;
    newValues.push(newItem);
    setConditions(newValues);
  };

  // OnChange select Field
  const choiceFieldChange = (data, index) => {
    let newValues = cloneDeep(conditions);
    // Find the complete object based on the selected value
    const selectedObj = optionsFieldsID.find(
      (option) => option.value === data.value,
    );

    if (index >= 0 && index < newValues.length) {
      const obj = cloneDeep(selectedObj);
      newValues[index].field = obj;
      newValues[index].field_id = obj.value;
      setConditions(newValues);
    }
  };

  // OnChange select Condition
  const conditionFieldChange = (conditionID, index) => {
    let newValues = cloneDeep(conditions);
    if (index >= 0 && index < newValues.length) {
      newValues[index].condition = conditionID;
      setConditions(newValues);
    }
  };

  // OnChange select value of condition
  const conditionValueFieldChange = (value, index) => {
    let newValues = cloneDeep(conditions);
    newValues[index].value_condition = value;
    setConditions(newValues);
  };

  // create options from item choices
  const choicesOptions = (choices) => {
    let options = [];
    if (choices?.length > 0) {
      options = choices.map((value) => ({
        value: value,
        text: value,
      }));
    }
    return options;
  };

  const getInitialConditions = () => {
    if (value?.length > 0) {
      setConditions(value);
    } else {
      setConditions([initialCondition]);
    }
  };

  // initialized conditions value
  useEffect(() => {
    if (value?.length > 0) {
      setConditions(value);
    }
  }, [value]);

  useEffect(() => {
    if (conditions.length === 0) {
      setConditions([initialCondition]);
    }
  }, [conditions]);

  // reset fields modal not confirmed
  useEffect(() => {
    if (showModalChoices) {
      if (!value || value?.length === 0) {
        setConditions([initialCondition]);
      } else {
        setConditions(value);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showModalChoices]);

  return (
    <Grid.Row className="visibility-conditions-widget">
      <div className="ui message wrapper-widget">
        <div className="wrapper-widget-label">
          <label htmlFor="form_visibility_conditions">
            {intl.formatMessage(messages.visible_conditions_widget_title)}:
          </label>
          <Modal
            className="modal_visibility_conditions"
            onClose={() => setShowModalChoices(false)}
            onOpen={() => {
              setShowModalChoices(true);
            }}
            open={showModalChoices}
            trigger={
              <Button size="medium" compact icon>
                <Icon name={configSVG} size="1.5rem" />
              </Button>
            }
          >
            <ModalHeader>
              {intl.formatMessage(messages.visible_conditions_widget_title)}
            </ModalHeader>
            <ModalContent>
              <ModalDescription>
                {conditions?.map((item, index) => (
                  <Grid stackable columns="equal" className="grid-row-wrapper">
                    <Grid.Row stretched>
                      <Grid.Column
                        width={1}
                        className="choice-operator"
                        verticalAlign="middle"
                      >
                        {/* TO DO: make a select where you can choose AND or OR */}
                        <p>
                          {index === 0
                            ? intl.formatMessage(
                                messages.visible_conditions_widget_if,
                              )
                            : intl.formatMessage(
                                messages.visible_conditions_widget_and,
                              )}
                        </p>
                      </Grid.Column>
                      <Grid.Column
                        width={5}
                        className="choice-field"
                        verticalAlign="middle"
                      >
                        <Select
                          placeholder={intl.formatMessage(
                            messages.visible_conditions_widget_fields,
                          )}
                          value={item?.field?.value ? item.field.value : null}
                          onChange={(e, data) => {
                            choiceFieldChange(data, index);
                          }}
                          options={optionsFieldsID}
                        />
                        {/* TO DO: filter the array excluding the field you are focusing on */}
                      </Grid.Column>
                      <Grid.Column
                        width={5}
                        className="choice-condition"
                        verticalAlign="middle"
                      >
                        <Select
                          placeholder={intl.formatMessage(
                            messages.visible_conditions_widget_options,
                          )}
                          onChange={(e, { value }) => {
                            conditionFieldChange(value, index);
                          }}
                          value={item.condition}
                          options={ConditionsListOptions()}
                        />
                      </Grid.Column>
                      <Grid.Column
                        width={1}
                        className="choice-actions"
                        verticalAlign="middle"
                      >
                        <Button
                          negative
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            deleteCondition(index);
                          }}
                          icon
                          className="choice-delete"
                          title={intl.formatMessage(
                            messages.visible_conditions_widget_delete,
                          )}
                        >
                          <Icon name={deleteSVG} size="1.2rem" />
                        </Button>
                      </Grid.Column>
                    </Grid.Row>

                    <Grid.Row centered>
                      <Grid.Column
                        width={10}
                        className="choice-actions"
                        verticalAlign={
                          item?.field?.field_type !== 'checkbox'
                            ? 'middle'
                            : 'left'
                        }
                      >
                        {/* Condition if field_type is like text */}
                        {checkTypeTextField(item) && (
                          <Input
                            id="field_type_text"
                            name="field_type_text"
                            placeholder={intl.formatMessage(
                              messages.visible_conditions_widget_text,
                            )}
                            className="choice-input"
                            value={item.value_condition}
                            onChange={(e) => {
                              conditionValueFieldChange(e.target.value, index);
                            }}
                          />
                        )}
                        {/* Condition if field_type is like number */}
                        {checkTypeNumberField(item) && (
                          <Input
                            id="field_type_number"
                            name="field_type_number"
                            placeholder={intl.formatMessage(
                              messages.visible_conditions_widget_text,
                            )}
                            className="choice-input"
                            value={item.value_condition}
                            onChange={(e) => {
                              conditionValueFieldChange(e.target.value, index);
                            }}
                          />
                        )}
                        {/* Condition if field has a choices */}
                        {/* TO DO: do a multiselect if multiple values ​​can be selected */}
                        {checkTypeSelectionField(item) && (
                          <Select
                            placeholder={intl.formatMessage(
                              messages.visible_conditions_widget_options,
                            )}
                            onChange={(e, { value }) => {
                              conditionValueFieldChange(value, index);
                            }}
                            value={item.value_condition}
                            options={choicesOptions(item.field?.choices ?? [])}
                          />
                        )}
                        {checkTypeBooleanField(item) && (
                          <>
                            <Radio
                              id="field_bool_true"
                              name="field_bool_true"
                              className="field_boolean"
                              checked={item.value_condition}
                              label={intl.formatMessage(
                                messages.visible_conditions_widget_true,
                              )}
                              onChange={(e) => {
                                conditionValueFieldChange(true, index);
                              }}
                            />
                            <Radio
                              id="field_bool_false"
                              name="field_bool_false"
                              checked={!item.value_condition}
                              label={intl.formatMessage(
                                messages.visible_conditions_widget_false,
                              )}
                              onChange={(e) => {
                                conditionValueFieldChange(false, index);
                              }}
                            />
                          </>
                        )}
                        {checkTypeDateField(item) && (
                          <Input
                            id="field"
                            name="field"
                            type="date"
                            placeholder={intl.formatMessage(
                              messages.visible_conditions_widget_text,
                            )}
                            className="choice-input"
                            value={item.value_condition}
                            onChange={(e) => {
                              conditionValueFieldChange(e.target.value, index);
                            }}
                          />
                        )}

                        {/* If none of the above conditions are satisfied */}
                        {!checkTypeTextField(item) &&
                          !checkTypeNumberField(item) &&
                          !checkTypeSelectionField(item) &&
                          !checkTypeBooleanField(item) &&
                          !checkTypeDateField(item) &&
                          item?.condition !== 'is_empty' &&
                          item?.condition !== 'is_not_empty' &&
                          item?.condition &&
                          item.field_id && (
                            <Message warning>
                              <p>
                                {intl.formatMessage(
                                  messages.visible_conditions_widget_not_satisfied,
                                )}
                              </p>
                            </Message>
                          )}
                      </Grid.Column>
                    </Grid.Row>
                  </Grid>
                ))}
                {/* ADD CONDITION BUTTON */}
                <Button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    addCondition();
                  }}
                  className="choice-add"
                  verticalAlign="middle"
                >
                  <Icon name={addSVG} size="1.5rem" />
                  {intl.formatMessage(messages.visible_conditions_widget_add)}
                </Button>
              </ModalDescription>
            </ModalContent>
            {/* MODAL ACTIONS */}
            <ModalActions>
              {/* TO DO: bug sul salvataggio dei dati anche quando fai annulla */}
              <Button
                type="button"
                onClick={() => {
                  setShowModalChoices(false);
                  getInitialConditions();
                }}
              >
                {intl.formatMessage(messages.visible_conditions_widget_cancel)}
              </Button>
              <Button
                type="button"
                color="primary"
                onClick={() => {
                  setShowModalChoices(false);
                  onChange(props.id, conditions);
                }}
              >
                {intl.formatMessage(messages.visible_conditions_widget_apply)}
              </Button>
            </ModalActions>
          </Modal>
        </div>
        {/* TEXTAREA WIDGET */}
        <TextArea
          id="form_visibility_conditions"
          name="form_visibility_conditions"
          value={createStringFormula(value)}
          readOnly
          disabled
        />
      </div>
    </Grid.Row>
  );
};

export default React.memo(VisibilityConditionsWidget);
