import { clickLineSelect } from './clickLineSelect';
import { indentGuide } from './indentGuide';
import { specialCharsShow } from './specialCharsShow';
import { statusbar } from './statusbar';

export const loadExtensions = () => {
  clickLineSelect();
  indentGuide();
  specialCharsShow();
  statusbar();
};
