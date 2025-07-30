import React from "react";
import { makeStyles } from "@material-ui/core/styles";
import { FormControl, Select, MenuItem } from "@material-ui/core";
import { i18n } from "../../translate/i18n";

const useStyles = makeStyles((theme) => ({
  formControl: {
    margin: theme.spacing(1),
    minWidth: 120,
  },
  select: {
    color: "inherit",
    "& .MuiSelect-icon": {
      color: "inherit",
    },
  },
}));

const LanguageSelector = () => {
  const classes = useStyles();

  const handleLanguageChange = (event) => {
    const newLanguage = event.target.value;
    i18n.changeLanguage(newLanguage);
    localStorage.setItem('i18nextLng', newLanguage);
  };

  const getCurrentLanguage = () => {
    return i18n.language || localStorage.getItem('i18nextLng') || 'es';
  };

  return (
    <FormControl className={classes.formControl} variant="outlined" size="small">
      <Select
        value={getCurrentLanguage()}
        onChange={handleLanguageChange}
        className={classes.select}
      >
        <MenuItem value="es">🇪🇸 Español</MenuItem>
        <MenuItem value="en">🇺🇸 English</MenuItem>
        <MenuItem value="pt">🇧🇷 Português</MenuItem>
      </Select>
    </FormControl>
  );
};

export default LanguageSelector;