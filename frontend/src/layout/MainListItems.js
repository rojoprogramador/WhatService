import React, { useContext, useEffect, useReducer, useState } from "react";
import { Link as RouterLink, useHistory, useLocation } from "react-router-dom";

import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemText from "@material-ui/core/ListItemText";
import ListSubheader from "@material-ui/core/ListSubheader";
import Divider from "@material-ui/core/Divider";
import { Badge, Collapse, List } from "@material-ui/core";
import DashboardOutlinedIcon from "@material-ui/icons/DashboardOutlined";
import WhatsAppIcon from "@material-ui/icons/WhatsApp";
import SyncAltIcon from "@material-ui/icons/SyncAlt";
import SettingsOutlinedIcon from "@material-ui/icons/SettingsOutlined";
import PeopleAltOutlinedIcon from "@material-ui/icons/PeopleAltOutlined";
import ContactPhoneOutlinedIcon from "@material-ui/icons/ContactPhoneOutlined";
import AccountTreeOutlinedIcon from "@material-ui/icons/AccountTreeOutlined";
import FlashOnIcon from "@material-ui/icons/FlashOn";
import HelpOutlineIcon from "@material-ui/icons/HelpOutline";
import CodeRoundedIcon from "@material-ui/icons/CodeRounded";
import EventIcon from "@material-ui/icons/Event";
import LocalOfferIcon from "@material-ui/icons/LocalOffer";
import EventAvailableIcon from "@material-ui/icons/EventAvailable";
import ExpandLessIcon from "@material-ui/icons/ExpandLess";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import PeopleIcon from "@material-ui/icons/People";
import ListIcon from "@material-ui/icons/ListAlt";
import AnnouncementIcon from "@material-ui/icons/Announcement";
import ForumIcon from "@material-ui/icons/Forum";
import LocalAtmIcon from '@material-ui/icons/LocalAtm';
import RotateRight from "@material-ui/icons/RotateRight";
import { i18n } from "../translate/i18n";
import { WhatsAppsContext } from "../context/WhatsApp/WhatsAppsContext";
import { AuthContext } from "../context/Auth/AuthContext";
import LoyaltyRoundedIcon from '@material-ui/icons/LoyaltyRounded';
import { Can } from "../components/Can";
import { SocketContext } from "../context/Socket/SocketContext";
import { isArray } from "lodash";
import TableChartIcon from '@material-ui/icons/TableChart';
import api from "../services/api";
import BorderColorIcon from '@material-ui/icons/BorderColor';
import ToDoList from "../pages/ToDoList/";
import toastError from "../errors/toastError";
import { makeStyles } from "@material-ui/core/styles";
import { AllInclusive, AttachFile, BlurCircular, Description, DeviceHubOutlined, Schedule } from '@material-ui/icons';
import usePlans from "../hooks/usePlans";
import Typography from "@material-ui/core/Typography";
import useVersion from "../hooks/useVersion";

const useStyles = makeStyles((theme) => ({
  ListSubheader: {
    height: 26,
    marginTop: "-15px",
    marginBottom: "-10px",
  },
  logoutButton: {
    borderRadius: 10,
    marginTop: 10,
    backgroundColor: theme.palette.sair.main,
    color: theme.palette.text.sair,
  },
  menuItem: {
    borderRadius: '12px',
    margin: '2px 8px',
    transition: 'all 0.3s ease',
    '&:hover': {
      backgroundColor: theme.mode === 'light' 
        ? 'rgba(26, 188, 156, 0.08)' 
        : 'rgba(0, 123, 255, 0.08)',
      transform: 'translateX(2px)',
    },
  },
  activeMenuItem: {
    background: theme.mode === 'light' 
      ? 'linear-gradient(135deg, #1abc9c 0%, #16a085 100%)' 
      : 'linear-gradient(135deg, #007bff 0%, #1abc9c 100%)',
    color: theme.palette.common.white,
    borderRadius: '12px',
    margin: '4px 8px',
    boxShadow: theme.mode === 'light' 
      ? '0 3px 8px rgba(26, 188, 156, 0.3)' 
      : '0 3px 8px rgba(0, 123, 255, 0.3)',
    transform: 'translateX(4px)',
    transition: 'all 0.3s ease',
    '&:hover': {
      background: theme.mode === 'light' 
        ? 'linear-gradient(135deg, #16a085 0%, #1abc9c 100%)' 
        : 'linear-gradient(135deg, #0056b3 0%, #007bff 100%)',
      transform: 'translateX(6px)',
      boxShadow: theme.mode === 'light' 
        ? '0 4px 12px rgba(26, 188, 156, 0.4)' 
        : '0 4px 12px rgba(0, 123, 255, 0.4)',
    },
    '& .MuiListItemIcon-root': {
      color: theme.palette.common.white,
      minWidth: '40px',
    },
    '& .MuiListItemText-primary': {
      color: theme.palette.common.white,
      fontWeight: 'bold',
      fontSize: '0.95rem',
    },
  },
}));


function ListItemLink(props) {
  const { icon, primary, to, className } = props;
  const location = useLocation();
  const classes = useStyles();

  const renderLink = React.useMemo(
    () =>
      React.forwardRef((itemProps, ref) => (
        <RouterLink to={to} ref={ref} {...itemProps} />
      )),
    [to]
  );

  const isActive = location.pathname === to;

  return (
    <li>
      <ListItem 
        button 
        dense 
        component={renderLink} 
        className={`${className || ''} ${isActive ? classes.activeMenuItem : classes.menuItem}`}
      >
        {icon ? <ListItemIcon>{icon}</ListItemIcon> : null}
        <ListItemText primary={primary} />
      </ListItem>
    </li>
  );
}

const reducer = (state, action) => {
  if (action.type === "LOAD_CHATS") {
    const chats = action.payload;
    const newChats = [];

    if (isArray(chats)) {
      chats.forEach((chat) => {
        const chatIndex = state.findIndex((u) => u.id === chat.id);
        if (chatIndex !== -1) {
          state[chatIndex] = chat;
        } else {
          newChats.push(chat);
        }
      });
    }

    return [...state, ...newChats];
  }

  if (action.type === "UPDATE_CHATS") {
    const chat = action.payload;
    const chatIndex = state.findIndex((u) => u.id === chat.id);

    if (chatIndex !== -1) {
      state[chatIndex] = chat;
      return [...state];
    } else {
      return [chat, ...state];
    }
  }

  if (action.type === "DELETE_CHAT") {
    const chatId = action.payload;

    const chatIndex = state.findIndex((u) => u.id === chatId);
    if (chatIndex !== -1) {
      state.splice(chatIndex, 1);
    }
    return [...state];
  }

  if (action.type === "RESET") {
    return [];
  }

  if (action.type === "CHANGE_CHAT") {
    const changedChats = state.map((chat) => {
      if (chat.id === action.payload.chat.id) {
        return action.payload.chat;
      }
      return chat;
    });
    return changedChats;
  }
};

const MainListItems = (props) => {
  const classes = useStyles();
  const { drawerClose, collapsed } = props;
  const { whatsApps } = useContext(WhatsAppsContext);
  const { user, handleLogout } = useContext(AuthContext);
  const [connectionWarning, setConnectionWarning] = useState(false);
  const [openCampaignSubmenu, setOpenCampaignSubmenu] = useState(false);
  const [showCampaigns, setShowCampaigns] = useState(false);
  const [showKanban, setShowKanban] = useState(false);
  const [showOpenAi, setShowOpenAi] = useState(false);
  const [showIntegrations, setShowIntegrations] = useState(false); const history = useHistory();
  const [showSchedules, setShowSchedules] = useState(false);
  const [showInternalChat, setShowInternalChat] = useState(false);
  const [showExternalApi, setShowExternalApi] = useState(false);


  const [invisible, setInvisible] = useState(true);
  const [pageNumber, setPageNumber] = useState(1);
  const [searchParam] = useState("");
  const [chats, dispatch] = useReducer(reducer, []);
  const { getPlanCompany } = usePlans();
  
  const [version, setVersion] = useState(false);
  
  
  const { getVersion } = useVersion();

  const socketManager = useContext(SocketContext);

  useEffect(() => {
    async function fetchVersion() {
      const _version = await getVersion();
      setVersion(_version.version);
    }
    fetchVersion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
 

  useEffect(() => {
    dispatch({ type: "RESET" });
    setPageNumber(1);
  }, [searchParam]);

  useEffect(() => {
    async function fetchData() {
      const companyId = user.companyId;
      if (!companyId) {
        return;
      }
      
      try {
        const planConfigs = await getPlanCompany(undefined, companyId);
        if (planConfigs && planConfigs.plan) {
          setShowCampaigns(planConfigs.plan.useCampaigns);
          setShowKanban(planConfigs.plan.useKanban);
          setShowOpenAi(planConfigs.plan.useOpenAi);
          setShowIntegrations(planConfigs.plan.useIntegrations);
          setShowSchedules(planConfigs.plan.useSchedules);
          setShowInternalChat(planConfigs.plan.useInternalChat);
          setShowExternalApi(planConfigs.plan.useExternalApi);
        }
      } catch (error) {
        console.error('Error fetching plan configs:', error);
      }
    }
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.companyId]);



  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchChats();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParam, pageNumber]);

  useEffect(() => {
    const companyId = localStorage.getItem("companyId");
    const socket = socketManager.getSocket(companyId);

    socket.on(`company-${companyId}-chat`, (data) => {
      if (data.action === "new-message") {
        dispatch({ type: "CHANGE_CHAT", payload: data });
      }
      if (data.action === "update") {
        dispatch({ type: "CHANGE_CHAT", payload: data });
      }
    });
    return () => {
      socket.disconnect();
    };
  }, [socketManager]);

  useEffect(() => {
    let unreadsCount = 0;
    if (chats.length > 0) {
      for (let chat of chats) {
        for (let chatUser of chat.users) {
          if (chatUser.userId === user.id) {
            unreadsCount += chatUser.unreads;
          }
        }
      }
    }
    if (unreadsCount > 0) {
      setInvisible(false);
    } else {
      setInvisible(true);
    }
  }, [chats, user.id]);

  useEffect(() => {
    if (localStorage.getItem("cshow")) {
      setShowCampaigns(true);
    }
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (whatsApps.length > 0) {
        const offlineWhats = whatsApps.filter((whats) => {
          return (
            whats.status === "qrcode" ||
            whats.status === "PAIRING" ||
            whats.status === "DISCONNECTED" ||
            whats.status === "TIMEOUT" ||
            whats.status === "OPENING"
          );
        });
        if (offlineWhats.length > 0) {
          setConnectionWarning(true);
        } else {
          setConnectionWarning(false);
        }
      }
    }, 2000);
    return () => clearTimeout(delayDebounceFn);
  }, [whatsApps]);

  const fetchChats = async () => {
    try {
      const { data } = await api.get("/chats/", {
        params: { searchParam, pageNumber },
      });
      dispatch({ type: "LOAD_CHATS", payload: data.records });
    } catch (err) {
      toastError(err);
    }
  };

  const handleClickLogout = () => {
    //handleCloseMenu();
    handleLogout();
  };

  return (
    <div onClick={drawerClose}>
      <Can
        role={user.profile}
        perform={"drawer-service-items:view"}
        style={{
          overflowY: "scroll",
        }}
        no={() => (
          <>
            <ListSubheader
              hidden={collapsed}
              style={{
                position: "relative",
                fontSize: "17px",
                textAlign: "left",
                paddingLeft: 20
              }}
              inset
              color="inherit">
              <Typography variant="overline" style={{ fontWeight: 'normal' }}>  {i18n.t("Servicios")} </Typography>
            </ListSubheader>
            <>

              <ListItemLink
                to="/tickets"
                primary={i18n.t("mainDrawer.listItems.tickets")}
                icon={<WhatsAppIcon />}
              />
              <ListItemLink
                to="/quick-messages"
                primary={i18n.t("mainDrawer.listItems.quickMessages")}
                icon={<FlashOnIcon />}
              />
              {showKanban && (
                <ListItemLink
                  to="/kanban"
                  primary="Kanban"
                  icon={<LoyaltyRoundedIcon />}
                />
              )}
              <ListItemLink
                to="/todolist"
                primary={i18n.t("mainDrawer.listItems.rates")}
                icon={<BorderColorIcon />}
              />
              <ListItemLink
                to="/contacts"
                primary={i18n.t("mainDrawer.listItems.contacts")}
                icon={<ContactPhoneOutlinedIcon />}
              />
              {showSchedules && (
                <>
                  <ListItemLink
                    to="/schedules"
                    primary={i18n.t("mainDrawer.listItems.schedules")}
                    icon={<Schedule />}
                  />
                </>
              )}
              <ListItemLink
                to="/tags"
                primary={i18n.t("mainDrawer.listItems.tags")}
                icon={<LocalOfferIcon />}
              />
              {showInternalChat && (
                <>
                  <ListItemLink
                    to="/chats"
                    primary={i18n.t("mainDrawer.listItems.chats")}
                    icon={
                      <Badge color="secondary" variant="dot" invisible={invisible}>
                        <ForumIcon />
                      </Badge>
                    }
                  />
                </>
              )}
              <ListItemLink
                to="/helps"
                primary={i18n.t("mainDrawer.listItems.helps")}
                icon={<HelpOutlineIcon />}
              />
            </>
          </>
        )}
      />

      <Can
        role={user.profile}
        perform={"drawer-admin-items:view"}
        yes={() => (
          <>
            <ListSubheader
              hidden={collapsed}
              style={{
                position: "relative",
                fontSize: "17px",
                textAlign: "left",
                paddingLeft: 20
              }}
              inset
              color="inherit">

              <Typography variant="overline" style={{ fontWeight: 'normal' }}>  {i18n.t("Gestión")} </Typography>
            </ListSubheader>

            <ListItemLink
              small
              to="/"
              primary="Dashboard"
              icon={<DashboardOutlinedIcon />}
            />
          </>
        )}
      />
      <Can
        role={user.profile}
        perform="drawer-admin-items:view"
        yes={() => (
          <>

            {showCampaigns && (
              <>
                <ListSubheader
                  hidden={collapsed}
                  style={{
                    position: "relative",
                    fontSize: "17px",
                    textAlign: "left",
                    paddingLeft: 20
                  }}
                  inset
                  color="inherit">
                  <Typography variant="overline" style={{ fontWeight: 'normal' }}>  {i18n.t("Campañas")} </Typography>
                </ListSubheader>

                <ListItemLink
                  small
                  to="/campaigns"
                  primary={i18n.t("mainDrawer.listItems.listing")}
                  icon={<ListIcon />}
                />

                <ListItemLink
                  small
                  to="/contact-lists"
                  primary={i18n.t("mainDrawer.listItems.contactList")}
                  icon={<PeopleIcon />}
                />


                <ListItemLink
                  small
                  to="/campaigns-config"
                  primary={i18n.t("mainDrawer.listItems.settings")}
                  icon={<ListIcon />}
                />


                {/** 
                <ListItem
                  button
                  onClick={() => setOpenCampaignSubmenu((prev) => !prev)}
                >
                  <ListItemIcon>
                    <EventAvailableIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary={i18n.t("mainDrawer.listItems.campaigns")}
                  />
                  {openCampaignSubmenu ? (
                    <ExpandLessIcon />
                  ) : (
                    <ExpandMoreIcon />
                  )}
                </ListItem>
                <Collapse
                  style={{ paddingLeft: 15 }}
                  in={openCampaignSubmenu}
                  timeout="auto"
                  unmountOnExit
                >
                  <List component="div" disablePadding>
                    
                    <ListItem onClick={() => history.push("/campaigns")} button>
                      <ListItemIcon>
                        <ListIcon />
                      </ListItemIcon>
                      <ListItemText primary="Listagem" />
                    </ListItem>

                    <ListItem
                      onClick={() => history.push("/contact-lists")}
                      button
                    >
                      <ListItemIcon>
                        <PeopleIcon />
                      </ListItemIcon>
                      <ListItemText primary="Listas de Contatos" />
                    </ListItem>

                    <ListItem
                      onClick={() => history.push("/campaigns-config")}
                      button
                    >
                      <ListItemIcon>
                        <SettingsOutlinedIcon />
                      </ListItemIcon>
                      <ListItemText primary="Configurações" />
                    </ListItem>

                  </List>
                </Collapse>
                */}
              </>
            )}

            <ListSubheader
              hidden={collapsed}
              style={{
                position: "relative",
                fontSize: "17px",
                textAlign: "left",
                paddingLeft: 20
              }}
              inset
              color="inherit">
              <Typography variant="overline" style={{ fontWeight: 'normal' }}>  {i18n.t("Administración")} </Typography>
            </ListSubheader>

            {user.super && (
              <ListItemLink
                to="/announcements"
                primary={i18n.t("mainDrawer.listItems.annoucements")}
                icon={<AnnouncementIcon />}
              />
            )}
            {showOpenAi && (
              <ListItemLink
                to="/prompts"
                primary={i18n.t("mainDrawer.listItems.prompts")}
                icon={<AllInclusive />}
              />
            )}

            {showIntegrations && (
              <ListItemLink
                to="/queue-integration"
                primary={i18n.t("mainDrawer.listItems.queueIntegration")}
                icon={<DeviceHubOutlined />}
              />
            )}
            <ListItemLink
              to="/connections"
              primary={i18n.t("mainDrawer.listItems.connections")}
              icon={
                <Badge badgeContent={connectionWarning ? "!" : 0} color="error">
                  <SyncAltIcon />
                </Badge>
              }
            />
            <ListItemLink
              to="/files"
              primary={i18n.t("mainDrawer.listItems.files")}
              icon={<AttachFile />}
            />
            <ListItemLink
              to="/queues"
              primary={i18n.t("mainDrawer.listItems.queues")}
              icon={<AccountTreeOutlinedIcon />}
            />
            <ListItemLink
              to="/users"
              primary={i18n.t("mainDrawer.listItems.users")}
              icon={<PeopleAltOutlinedIcon />}
            />
            {showExternalApi && (
              <>
                <ListItemLink
                  to="/messages-api"
                  primary={i18n.t("mainDrawer.listItems.messagesAPI")}
                  icon={<CodeRoundedIcon />}
                />
              </>
            )}
            <ListItemLink
              to="/financeiro"
              primary={i18n.t("mainDrawer.listItems.financeiro")}
              icon={<LocalAtmIcon />}
            />

            <ListItemLink
              to="/settings"
              primary={i18n.t("mainDrawer.listItems.settings")}
              icon={<SettingsOutlinedIcon />}
            />
			
			
            {!collapsed && (
              <React.Fragment>
                <Divider />
              {/* 
              // IMAGEM NO MENU
              <Hidden only={['sm', 'xs']}>
                <img style={{ width: "100%", padding: "10px" }} src={logo} alt="image" />            
              </Hidden> 
              */}
              <Typography style={{ fontSize: "12px", padding: "10px", textAlign: "right", fontWeight: "bold" }}>
                Versión: {`${version}`}

                </Typography>
              </React.Fragment>
            )}
          </>
        )}
      />
	  <Divider />
	  <li>
		<ListItem
          button
          dense
          onClick={handleClickLogout}
          className={classes.logoutButton}
        >
          <ListItemIcon>
            <RotateRight />
          </ListItemIcon>
          <ListItemText primary={i18n.t("Salir")} />
        </ListItem>
      </li>
    </div>
  );
};

export default MainListItems;
