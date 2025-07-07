import React, { useContext, useEffect, useRef, useState } from "react";

import clsx from "clsx";
import { format, isSameDay, parseISO } from "date-fns";
import { useHistory, useParams } from "react-router-dom";
import Avatar from "@material-ui/core/Avatar";
import Badge from "@material-ui/core/Badge";
import Box from "@material-ui/core/Box";
import Divider from "@material-ui/core/Divider";
import ListItem from "@material-ui/core/ListItem";
import ListItemAvatar from "@material-ui/core/ListItemAvatar";
import ListItemSecondaryAction from "@material-ui/core/ListItemSecondaryAction";
import ListItemText from "@material-ui/core/ListItemText";
import Typography from "@material-ui/core/Typography";
import { blue, grey } from "@material-ui/core/colors";
import { makeStyles } from "@material-ui/core/styles";
import FaceIcon from "@material-ui/icons/Face";
import { i18n } from "../../translate/i18n";

import { Chip, Tooltip } from "@material-ui/core";
import { v4 as uuidv4 } from "uuid";
import { AuthContext } from "../../context/Auth/AuthContext";
import { TicketsContext } from "../../context/Tickets/TicketsContext";
import toastError from "../../errors/toastError";
import api from "../../services/api";
import ButtonWithSpinner from "../ButtonWithSpinner";
import MarkdownWrapper from "../MarkdownWrapper";

import AndroidIcon from "@material-ui/icons/Android";
import VisibilityIcon from "@material-ui/icons/Visibility";
import ContactTag from "../ContactTag";
import TicketMessagesDialog from "../TicketMessagesDialog";
import TransferTicketModalCustom from "../TransferTicketModalCustom";
import { getInitials } from "../../helpers/getInitials";
import { generateColor } from "../../helpers/colorGenerator";

const useStyles = makeStyles((theme) => ({
  ticket: {
    position: "relative",
    padding: "8px 12px",
    margin: "2px 0",
    minHeight: "140px",
    overflow: "visible",
    [theme.breakpoints.down('sm')]: {
      padding: "6px 8px",
      margin: "1px 0",
      minHeight: "120px",
    },
    [theme.breakpoints.down('xs')]: {
      padding: "4px 6px",
      margin: "0px",
      minHeight: "110px",
    },
  },

  pendingTicket: {
    cursor: "unset",
  },
  queueTag: {
    background: "#FCFCFC",
    color: "#000",
    marginRight: 2,
    marginBottom: 2,
    padding: "1px 4px",
    fontWeight: 'bold',
    borderRadius: 3,
    fontSize: "0.7em",
    whiteSpace: "nowrap",
    border: "1px solid #e0e0e0",
  },
  noTicketsDiv: {
    display: "flex",
    height: "100px",
    margin: 40,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  newMessagesCount: {
    position: "absolute",
    alignSelf: "center",
    marginRight: 6,
    marginLeft: "auto",
    top: "8px",
    left: "16px",
    borderRadius: 3,
    [theme.breakpoints.down('sm')]: {
      top: "6px",
      left: "12px",
      marginRight: 4,
    },
    [theme.breakpoints.down('xs')]: {
      top: "4px",
      left: "8px",
      marginRight: 2,
      fontSize: "0.75em",
    },
  },
  noTicketsText: {
    textAlign: "center",
    color: "rgb(104, 121, 146)",
    fontSize: "14px",
    lineHeight: "1.4",
  },
  connectionTag: {
    background: theme.palette.mode === "light" 
      ? "linear-gradient(135deg, #1abc9c 0%, #16a085 100%)" 
      : "linear-gradient(135deg, #007bff 0%, #0056b3 100%)",
    color: "#FFF",
    marginRight: 2,
    marginBottom: 2,
    padding: "1px 6px",
    fontWeight: 'bold',
    borderRadius: 4,
    fontSize: "0.7em",
    whiteSpace: "nowrap",
    boxShadow: theme.palette.mode === "light" 
      ? "0 1px 3px rgba(26, 188, 156, 0.3)" 
      : "0 1px 3px rgba(0, 123, 255, 0.3)",
    textTransform: "uppercase",
    letterSpacing: "0.3px",
    [theme.breakpoints.down('sm')]: {
      fontSize: "0.65em",
      padding: "1px 4px",
      marginRight: 1,
    },
    [theme.breakpoints.down('xs')]: {
      fontSize: "0.6em",
      padding: "0px 3px",
      marginRight: 1,
      letterSpacing: "0.1px",
    },
  },
  noTicketsTitle: {
    textAlign: "center",
    fontSize: "16px",
    fontWeight: "600",
    margin: "0px",
  },

  contactNameWrapper: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginLeft: "2px",
    marginBottom: "2px",
    gap: "4px",
    [theme.breakpoints.down('sm')]: {
      gap: "2px",
      marginLeft: "1px",
      flexWrap: "wrap",
    },
    [theme.breakpoints.down('xs')]: {
      gap: "1px",
      marginLeft: "0px",
      flexDirection: "column",
      alignItems: "flex-start",
    },
  },

  lastMessageTime: {
    justifySelf: "flex-end",
    textAlign: "right",
    position: "relative",
    top: -16,
    background: theme.palette.mode === "light" ? '#333333' : '#444',
    color: '#ffffff',
    border: theme.palette.mode === "light" ? '1px solid #3a3b6c' : '1px solid #555',
    borderRadius: 3,
    padding: "1px 4px",
    fontSize: '0.75em',
    minWidth: 'auto',
    [theme.breakpoints.down('sm')]: {
      fontSize: '0.7em',
      padding: "1px 3px",
      top: -12,
    },
    [theme.breakpoints.down('xs')]: {
      fontSize: '0.65em',
      padding: "0px 2px",
      top: -8,
      position: "static",
      display: "inline-block",
      marginTop: "2px",
    },
  },

  closedBadge: {
    alignSelf: "center",
    justifySelf: "flex-end",
    marginRight: 32,
    marginLeft: "auto",
  },

  contactLastMessage: {
    paddingRight: "0%",
    marginLeft: "5px",
  },


  badgeStyle: {
    color: "white",
    backgroundColor: theme.palette.mode === "light" ? "#1abc9c" : "#007bff",
  },

  acceptButton: {
    position: "absolute",
    left: "22px",
    transform: "translateX(0%)",
    fontSize: "0.6rem !important",
    padding: "3px 8px !important",
    minWidth: "auto",
    width: "auto",
    maxWidth: "70px",
    height: "28px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "4px",
    fontWeight: "500",
    textTransform: "none",
    boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
    transition: "all 0.2s ease",
    "&:hover": {
      boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
      transform: "translateY(-1px)",
    },
    [theme.breakpoints.down('sm')]: {
      position: "relative",
      left: "auto",
      transform: "none",
      marginTop: "4px",
      width: "100%",
      maxWidth: "100%",
      fontSize: "0.55rem !important",
      padding: "2px 6px !important",
      height: "26px",
    },
    [theme.breakpoints.down('xs')]: {
      fontSize: "0.5rem !important",
      padding: "1px 4px !important",
      minHeight: "24px",
      height: "24px",
      maxWidth: "65px",
    },
  },


  ticketQueueColor: {
    flex: "none",
    width: "8px",
    height: "100%",
    position: "absolute",
    top: "0%",
    left: "0%",
  },

  ticketInfo: {
    position: "relative",
    top: -13
  },
  secondaryContentSecond: {
    display: 'flex',
    marginLeft: "6px",
    alignItems: "flex-start",
    flexWrap: "wrap",
    flexDirection: "row",
    alignContent: "flex-start",
  },
  ticketInfo1: {
    position: "relative",
    top: 13,
    right: 0
  },
  Radiusdot: {
    "& .MuiBadge-badge": {
      borderRadius: 2,
      position: "inherit",
      height: 16,
      margin: 2,
      padding: 3
    },
    "& .MuiBadge-anchorOriginTopRightRectangle": {
      transform: "scale(1) translate(0%, -40%)",
    },
  },
    presence: {
    color: theme?.mode === 'light' ? "#007bff" : "#1abc9c",
    fontWeight: "bold",
  },
  smallButton: {
    fontSize: '0.6rem !important',
    padding: '2px 6px !important',
    borderRadius: '4px',
    minWidth: 'auto',
    width: 'auto',
    maxWidth: '70px',
    height: '26px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    [theme.breakpoints.down('sm')]: {
      fontSize: '0.55rem !important',
      padding: '2px 6px !important',
      height: '26px',
      maxWidth: '100%',
    },
    [theme.breakpoints.down('xs')]: {
      fontSize: '0.5rem !important',
      padding: '1px 3px !important',
      minHeight: '24px',
      height: '24px',
      maxWidth: '70px',
    },
  },
  responsiveAvatar: {
    width: "70px !important",
    height: "70px !important",
    marginLeft: "10px !important",
    [theme.breakpoints.down('sm')]: {
      width: "60px !important",
      height: "60px !important",
      marginTop: "-15px !important",
      marginLeft: "2px !important",
    },
    [theme.breakpoints.down('xs')]: {
      width: "50px !important",
      height: "50px !important",
      marginTop: "-10px !important",
      marginLeft: "1px !important",
      fontSize: "0.8rem !important",
    },
  }
}));
  {/*PLW DESIGN INSERIDO O dentro do const handleChangeTab*/}
  const TicketListItemCustom = ({ ticket }) => {
  const classes = useStyles();
  const history = useHistory();
  const [loading, setLoading] = useState(false);
  const [ticketUser, setTicketUser] = useState(null);
  const [ticketQueueName, setTicketQueueName] = useState(null);
  const [ticketQueueColor, setTicketQueueColor] = useState(null);
  const [tag, setTag] = useState([]);
  const [whatsAppName, setWhatsAppName] = useState(null);
  const [lastInteractionLabel, setLastInteractionLabel] = useState('');
  const [openTicketMessageDialog, setOpenTicketMessageDialog] = useState(false);
  const { ticketId } = useParams();
  const isMounted = useRef(true);
  const { setCurrentTicket } = useContext(TicketsContext);
  const { user } = useContext(AuthContext);
  const [verpreview, setverpreview] = useState(false);
  const { profile } = user;
  const [transferTicketModalOpen, setTransferTicketModalOpen] = useState(false);
  const presenceMessage = { composing: "Digitando...", recording: "Gravando..." };
  
  useEffect(() => {
    if (ticket.userId && ticket.user) {
      setTicketUser(ticket.user?.name?.toUpperCase());
    }
    setTicketQueueName(ticket.queue?.name?.toUpperCase());
    setTicketQueueColor(ticket.queue?.color);

    if (ticket.whatsappId && ticket.whatsapp) {
      setWhatsAppName(ticket.whatsapp.name?.toUpperCase());
    }

    setTag(ticket?.tags);

    return () => {
      isMounted.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  {/*CÓDIGO NOVO SAUDAÇÃO*/}
  const handleCloseTicket = async (id) => {
    setTag(ticket?.tags);
    setLoading(true);
    try {
      await api.put(`/tickets/${id}`, {
        status: "closed",
        userId: user?.id,
        queueId: ticket?.queue?.id,
        useIntegration: false,
        promptId: null,
        integrationId: null
      });
    } catch (err) {
      setLoading(false);
      toastError(err);
    }
    if (isMounted.current) {
      setLoading(false);
    }
    history.push(`/tickets/`);
  };

  useEffect(() => {
    const renderLastInteractionLabel = () => {
      let labelColor = '';
      let labelText = '';

      if (!ticket.lastMessage) return '';

      const lastInteractionDate = parseISO(ticket.updatedAt);
      const currentDate = new Date();
      const timeDifference = currentDate - lastInteractionDate;
      const hoursDifference = Math.floor(timeDifference / (1000 * 60 * 60));
      const minutesDifference = Math.floor(timeDifference / (1000 * 60));


      if (minutesDifference >= 3 && minutesDifference <= 10) {
        labelText = `(${minutesDifference} m atrás)`;
        labelColor = '#1abc9c';
      } else if (minutesDifference >= 30 && minutesDifference < 60) {
        labelText = `(${minutesDifference} m atrás)`;
        labelColor = 'Orange';
      } else if (minutesDifference > 60  && hoursDifference < 24) {
        labelText = `(${hoursDifference} h atrás)`;
        labelColor = 'red';
      } else if (hoursDifference >= 24) {
        labelText = `(${Math.floor(hoursDifference / 24)} dias atrás)`;
        labelColor = 'red';
      }


      return { labelText, labelColor };
    };

    // Função para atualizar o estado do componente
    const updateLastInteractionLabel = () => {
      const { labelText, labelColor } = renderLastInteractionLabel();
      setLastInteractionLabel(
        <Badge
          className={classes.lastInteractionLabel}
          style={{ color: labelColor }}
        >
          {labelText}
        </Badge>
      );
      // Agendando a próxima atualização após 30 segundos
      return setTimeout(updateLastInteractionLabel, 30 * 1000);
    };

    // Inicializando a primeira atualização
    const timeoutId = updateLastInteractionLabel();

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [ticket]); // Executando apenas uma vez ao montar o componente

  const handleReopenTicket = async (id) => {
    setLoading(true);
    try {
      await api.put(`/tickets/${id}`, {
        status: "open",
        userId: user?.id,
        queueId: ticket?.queue?.id
      });
    } catch (err) {
      setLoading(false);
      toastError(err);
    }
    if (isMounted.current) {
      setLoading(false);
    }
    history.push(`/tickets/${ticket.uuid}`);
  };

    const handleAcepptTicket = async (id) => {
        setLoading(true);
        try {
            await api.put(`/tickets/${id}`, {
                status: "open",
                userId: user?.id,
            });
            
            let settingIndex;

            try {
                const { data } = await api.get("/settings/");
                
                settingIndex = data.filter((s) => s.key === "sendGreetingAccepted");
                
            } catch (err) {
                toastError(err);
                   
            }
            
            if (settingIndex[0].value === "enabled" && !ticket.isGroup) {
                handleSendMessage(ticket.id);
                
            }

        } catch (err) {
            setLoading(false);
            
            toastError(err);
        }
        if (isMounted.current) {
            setLoading(false);
        }

        // handleChangeTab(null, "tickets");
        // handleChangeTab(null, "open");
        history.push(`/tickets/${ticket.uuid}`);
    };
	
	    const handleSendMessage = async (id) => {
        
        const msg = `{{ms}} *{{name}}*, meu nome é *${user?.name}* e agora vou prosseguir com seu atendimento!`;
        const message = {
            read: 1,
            fromMe: true,
            mediaUrl: "",
            body: `*Mensagem Automática:*\n${msg.trim()}`,
        };
        try {
            await api.post(`/messages/${id}`, message);
        } catch (err) {
            toastError(err);
            
        }
    };
	{/*CÓDIGO NOVO SAUDAÇÃO*/}

  const handleSelectTicket = (ticket) => {
    const code = uuidv4();
    const { id, uuid } = ticket;
    setCurrentTicket({ id, uuid, code });
  };


  const renderTicketInfo = () => {
    if (ticketUser) {

      return (
        <>
          {ticket.chatbot && (
            <Tooltip title="Chatbot">
              <AndroidIcon
                fontSize="small"
                style={{ color: grey[700], marginRight: 5 }}
              />
            </Tooltip>
          )}

          {/* </span> */}
        </>
      );
    } else {
      return (
        <>
          {ticket.chatbot && (
            <Tooltip title="Chatbot">
              <AndroidIcon
                fontSize="small"
                style={{ color: grey[700], marginRight: 5 }}
              />
            </Tooltip>
          )}
        </>
      );
    }
  };

  const handleOpenTransferModal = () => {
    setTransferTicketModalOpen(true);
  }

  const handleCloseTransferTicketModal = () => {
    if (isMounted.current) {
      setTransferTicketModalOpen(false);
    }
  };

  return (
    <React.Fragment key={ticket.id}>

    <TransferTicketModalCustom
    modalOpen={transferTicketModalOpen}
    onClose={handleCloseTransferTicketModal}
    ticketid={ticket.id}
  />

      <TicketMessagesDialog
        open={openTicketMessageDialog}

        handleClose={() => setOpenTicketMessageDialog(false)}
        ticketId={ticket.id}
      ></TicketMessagesDialog>
      <ListItem dense button
        onClick={(e) => {
          if (ticket.status === "pending") return;
          handleSelectTicket(ticket);
        }}
        selected={ticketId && +ticketId === ticket.id}
        className={clsx(classes.ticket, {
          [classes.pendingTicket]: ticket.status === "pending",
        })}
      >
        <Tooltip arrow placement="right" title={ticket.queue?.name?.toUpperCase() || i18n.t("queueSelect.inputLabel")} >
          <span style={{ backgroundColor: ticket.queue?.color || "#7C7C7C" }} className={classes.ticketQueueColor}></span>
        </Tooltip>
        <ListItemAvatar>
          {ticket.status !== "pending" ?
            <Avatar
              className={classes.responsiveAvatar}
              style={{
                marginTop: "-20px",
                marginLeft: "-3px",
                width: "55px",
                height: "55px",
                borderRadius: "10%",
                backgroundColor: generateColor(ticket?.contact?.number),
              }}
              src={ticket?.contact?.profilePicUrl}>
              {getInitials(ticket?.contact?.name || "")}
              </Avatar>
            :
            <Avatar
              className={classes.responsiveAvatar}
              style={{
                marginTop: "-30px",
                marginLeft: "0px",
                width: "50px",
                height: "50px",
                borderRadius: "10%",
                backgroundColor: generateColor(ticket?.contact?.number),
              }}
              src={ticket?.contact?.profilePicUrl}>
              {getInitials(ticket?.contact?.name || "")}
              </Avatar>
          }
        </ListItemAvatar>
        <ListItemText
          disableTypography

          primary={
            <span className={classes.contactNameWrapper}>
            <Typography
            noWrap
            component='span'
            variant='body2'
            color='textPrimary'
          >
            <strong>{ticket.contact.name} {lastInteractionLabel}</strong>
                {profile === "admin" && (
                  <Tooltip title="Espiar Conversa">
                    <VisibilityIcon
                      onClick={() => setOpenTicketMessageDialog(true)}
                      fontSize="small"
                      style={{
                        color: blue[700],
                        cursor: "pointer",
                        marginLeft: 10,
                        verticalAlign: "middle"
                      }}
                    />
                  </Tooltip>
                )}
        <ListItemSecondaryAction>
          <Box className={classes.ticketInfo1}>{renderTicketInfo()}</Box>
        </ListItemSecondaryAction>
              </Typography>
        </span>

          }
          secondary={
            <span className={classes.contactNameWrapper}>

              <Typography
                className={classes.contactLastMessage}
                noWrap
                component="span"
                variant="body2"
                color="textSecondary"
              >
                {["composing", "recording"].includes(ticket?.presence) ? (
                  <span className={classes.presence}>
                    {presenceMessage[ticket.presence]}
                  </span>
                ) : (
                  <>
                    {ticket.lastMessage.includes('data:image/png;base64') ? <MarkdownWrapper> Localização</MarkdownWrapper> : <MarkdownWrapper>{ticket.lastMessage}</MarkdownWrapper>}
                  </>
                )}

                <span style={{ marginTop: 4, }} className={classes.secondaryContentSecond} >
                  {ticket?.whatsapp?.name ? <Badge className={classes.connectionTag}>{ticket?.whatsapp?.name?.toUpperCase()}</Badge> : <br></br>}
                  {ticketUser ? <Badge style={{ backgroundColor: "#000000" }} className={classes.connectionTag}>{ticketUser}</Badge> : <br></br>}				  
                  <Badge style={{ backgroundColor: ticket.queue?.color || "#7c7c7c" }} className={classes.connectionTag}>{ticket.queue?.name?.toUpperCase() || i18n.t("queueSelect.inputLabel").toUpperCase()}</Badge>
                </span>

                {/* <span style={{ marginTop: 2, fontSize: 5 }} className={classes.secondaryContentSecond} >
                  {ticket?.whatsapp?.name ? <Badge className={classes.connectionTag}>{ticket?.whatsapp?.name?.toUpperCase()}</Badge> : <br></br>}
                </span> */}

                {/*<span style={{ marginTop: 4, fontSize: 5 }} className={classes.secondaryContentSecond} >
                  {ticketUser ? <Chip size="small" icon={<FaceIcon />} label={ticketUser} variant="outlined" /> : <br></br>}
                </span>*/}

                <span style={{ paddingTop: "2px" }} className={classes.secondaryContentSecond} >
                  {tag?.map((tag) => {
                    return (
                      <ContactTag tag={tag} key={`ticket-contact-tag-${ticket.id}-${tag.id}`} />
                    );
                  })}
                </span>

              </Typography>

              <Badge
                className={classes.newMessagesCount}
                badgeContent={ticket.unreadMessages}
                classes={{
                  badge: classes.badgeStyle,
                }}
              />
            </span>
          }

        />
        <ListItemSecondaryAction>
          {ticket.lastMessage && (
            <>

              <Typography
                className={classes.lastMessageTime}
                component="span"
                variant="body2"
                color="textSecondary"
              >

                {isSameDay(parseISO(ticket.updatedAt), new Date()) ? (
                  <>{format(parseISO(ticket.updatedAt), "HH:mm")}</>
                ) : (
                  <>{format(parseISO(ticket.updatedAt), "dd/MM/yyyy")}</>
                )}
              </Typography>

              <br />

            </>
          )}

        </ListItemSecondaryAction>
<span className={classes.secondaryContentSecond}>
  {ticket.status === "pending" && (
    <>
      <ButtonWithSpinner
        style={{
          backgroundColor: '#1abc9c',
          color: 'white',
          padding: '2px 6px',
          top: '75px',
          borderRadius: '4px',
          left: '22px',
          fontSize: '0.6rem',
          width: '70px',
          height: '26px'
        }}
        variant="contained"
        className={classes.acceptButton}
        size="small"
        loading={loading}
        onClick={e => handleAcepptTicket(ticket.id)}
      >
        {i18n.t("ticketsList.buttons.accept")}
      </ButtonWithSpinner>

      <ButtonWithSpinner
        style={{
          backgroundColor: 'red',
          color: 'white',
          padding: '2px 6px',
          top: '103px',
          borderRadius: '4px',
          left: '22px',
          fontSize: '0.6rem',
          width: '70px',
          height: '26px'
        }}
        variant="contained"
        className={classes.acceptButton}
        size="small"
        loading={loading}
        onClick={e => handleCloseTicket(ticket.id)}
      >
        {i18n.t("ticketsList.buttons.closed")}
      </ButtonWithSpinner>
    </>
  )}

  {ticket.status === "attending" && (
    <>
      <ButtonWithSpinner
        style={{
          backgroundColor: '#1abc9c',
          color: 'white',
          padding: '2px 6px',
          top: '75px',
          borderRadius: '4px',
          left: '22px',
          fontSize: '0.6rem',
          width: '70px',
          height: '26px'
        }}
        variant="contained"
        className={classes.acceptButton}
        size="small"
        loading={loading}
        onClick={e => handleAcepptTicket(ticket.id)}
      >
        {i18n.t("ticketsList.buttons.accept")}
      </ButtonWithSpinner>

      <ButtonWithSpinner
        style={{
          backgroundColor: 'red',
          color: 'white',
          padding: '2px 6px',
          top: '103px',
          borderRadius: '4px',
          left: '22px',
          fontSize: '0.6rem',
          width: '70px',
          height: '26px'
        }}
        variant="contained"
        className={classes.acceptButton}
        size="small"
        loading={loading}
        onClick={e => handleCloseTicket(ticket.id)}
      >
        {i18n.t("ticketsList.buttons.closed")}
      </ButtonWithSpinner>
    </>
  )}

  {ticket.status !== "closed" && ticket.status !== "pending" && ticket.status !== "attending" && (
    <>
      <ButtonWithSpinner
        style={{
          backgroundColor: 'blue',
          color: 'white',
          padding: '2px 6px',
          top: '75px',
          borderRadius: '4px',
          left: '22px',
          fontSize: '0.6rem',
          width: '70px',
          height: '26px'
        }}
        variant="contained"
        className={classes.acceptButton}
        size="small"
        loading={loading}
        onClick={e => handleOpenTransferModal()}
      >
        {i18n.t("ticketsList.buttons.transfer")}
      </ButtonWithSpinner>

      <ButtonWithSpinner
        style={{
          backgroundColor: 'red',
          color: 'white',
          padding: '2px 6px',
          top: '103px',
          borderRadius: '4px',
          left: '22px',
          fontSize: '0.6rem',
          width: '70px',
          height: '26px'
        }}
        variant="contained"
        className={classes.acceptButton}
        size="small"
        loading={loading}
        onClick={e => handleCloseTicket(ticket.id)}
      >
        {i18n.t("ticketsList.buttons.closed")}
      </ButtonWithSpinner>
    </>
  )}

  {ticket.status === "closed" && (
    <ButtonWithSpinner
      style={{
        backgroundColor: 'red',
        color: 'white',
        padding: '0px',
        bottom: '0px',
        borderRadius: '4px',
        left: '33px',
        fontSize: '0.6rem'
      }}
      variant="contained"
      className={classes.acceptButton}
      size="small"
      loading={loading}
      onClick={e => handleReopenTicket(ticket.id)}
    >
      {i18n.t("ticketsList.buttons.reopen")}
    </ButtonWithSpinner>
  )}
</span>

      
      </ListItem>

      <Divider variant="inset" component="li" />
    </React.Fragment>
  );
};

export default TicketListItemCustom;
