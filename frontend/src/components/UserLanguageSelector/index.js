import React, { useContext, useState, useEffect } from "react";

import { Button, Menu, MenuItem } from "@material-ui/core";
import TranslateIcon from "@material-ui/icons/Translate";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";

import { i18n } from "../../translate/i18n";
import { AuthContext } from "../../context/Auth/AuthContext";
import toastError from "../../errors/toastError";
import api from "../../services/api";

const UserLanguageSelector = () => {
    const [langueMenuAnchorEl, setLangueMenuAnchorEl] = useState(null);
    const [currentLanguage, setCurrentLanguage] = useState(i18n.language);

    const { user } = useContext(AuthContext);

    useEffect(() => {
        const updateLanguage = () => {
            setCurrentLanguage(i18n.language);
        };

        i18n.on('languageChanged', updateLanguage);

        return () => {
            i18n.off('languageChanged', updateLanguage);
        };
    }, []);

    const handleOpenLanguageMenu = e => {
        setLangueMenuAnchorEl(e.currentTarget);
    };

    const handleCloseLanguageMenu = () => {
        setLangueMenuAnchorEl(null);
    };

    const handleChangeLanguage = async language => {
        try {
            await i18n.changeLanguage(language);
            setCurrentLanguage(language);
            await api.put(`/users/${user.id}`, { language });
        } catch (err) {
            toastError(err);
        }

        handleCloseLanguageMenu();
    };

    return (
        <>
            <Button
                color="inherit"
                onClick={handleOpenLanguageMenu}
                startIcon={<TranslateIcon />}
                endIcon={<ExpandMoreIcon />}
            >
                {i18n.t(`languages.${currentLanguage}`)}
            </Button>
            <Menu
                anchorEl={langueMenuAnchorEl}
                keepMounted
                open={Boolean(langueMenuAnchorEl)}
                onClose={handleCloseLanguageMenu}
            >
                <MenuItem onClick={() => handleChangeLanguage("es")}>
                    {i18n.t("languages.es")}
                </MenuItem>
                <MenuItem onClick={() => handleChangeLanguage("en")}>
                    {i18n.t("languages.en")}
                </MenuItem>
                <MenuItem onClick={() => handleChangeLanguage("pt")}>
                    {i18n.t("languages.pt")}
                </MenuItem>
            </Menu>
        </>
    );
};

export default UserLanguageSelector;
