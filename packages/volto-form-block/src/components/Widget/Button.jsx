/**
 * Button component.
 * This is a wrapper for Buttons, to eventually customize Button component if you don't like to use semantic-ui, for example.
 * @module components/Widget/Button
 */

import { Button as SemanticButton } from 'semantic-ui-react';

const Button = (props) => {
  return <SemanticButton {...props} />;
};

export default Button;
