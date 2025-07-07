import React, { useState, useEffect, useRef, useContext } from "react";

import { useHistory, useParams } from "react-router-dom";
import { parseISO, format, isSameDay } from "date-fns";
import clsx from "clsx";

import { makeStyles } from "@material-ui/core/styles";
import { green } from "@material-ui/core/colors";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";
import ListItemAvatar from "@material-ui/core/ListItemAvatar";
import Typography from "@material-ui/core/Typography";
import Avatar from "@material-ui/core/Avatar";
import Divider from "@material-ui/core/Divider";
import Badge from "@material-ui/core/Badge";

import { i18n } from "../../translate/i18n";

import api from "../../services/api";
import ButtonWithSpinner from "../ButtonWithSpinner";
import MarkdownWrapper from "../MarkdownWrapper";
import { Tooltip } from "@material-ui/core";
import { AuthContext } from "../../context/Auth/AuthContext";
import toastError from "../../errors/toastError";

const useStyles = makeStyles((theme) => ({
  ticket: {
    position: "relative",
    borderRadius: "12px",
    margin: "4px 8px",
    transition: "all 0.3s ease",
    backgroundColor: theme.palette.mode === "light" ? "#fff" : theme.palette.background.paper,
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
    "&:hover": {
      transform: "translateY(-2px)",
      boxShadow: theme.palette.mode === "light" 
        ? "0 4px 16px rgba(26, 188, 156, 0.15)" 
        : "0 4px 16px rgba(0, 123, 255, 0.15)",
    },
  },

  pendingTicket: {
    cursor: "unset",
    backgroundColor: theme.palette.mode === "light" 
      ? "rgba(26, 188, 156, 0.05)" 
      : "rgba(0, 123, 255, 0.05)",
    borderLeft: `4px solid ${theme.palette.mode === "light" ? "#1abc9c" : "#007bff"}`,
  },

  noTicketsDiv: {
    display: "flex",
    height: "100px",
    margin: 40,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },

  noTicketsText: {
    textAlign: "center",
    color: theme.palette.mode === "light" ? "rgb(104, 121, 146)" : "#bbb",
    fontSize: "14px",
    lineHeight: "1.4",
  },

  noTicketsTitle: {
    textAlign: "center",
    fontSize: "16px",
    fontWeight: "600",
    margin: "0px",
    color: theme.palette.mode === "light" ? "#1abc9c" : "#007bff",
  },

  contactNameWrapper: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },

  lastMessageTime: {
    justifySelf: "flex-end",
    color: theme.palette.mode === "light" ? "#666" : "#999",
    fontSize: "0.75rem",
  },

  closedBadge: {
    alignSelf: "center",
    justifySelf: "flex-end",
    marginRight: 16,
    marginLeft: "auto",
    backgroundColor: "#e74c3c",
    color: "white",
    fontWeight: "bold",
    borderRadius: "12px",
  },

  contactLastMessage: {
    paddingRight: 20,
    color: theme.palette.mode === "light" ? "#555" : "#ddd",
  },

  newMessagesCount: {
    alignSelf: "center",
    marginRight: 8,
    marginLeft: "auto",
  },

  badgeStyle: {
    color: "white",
    backgroundColor: theme.palette.mode === "light" ? "#1abc9c" : "#007bff",
    fontWeight: "bold",
    borderRadius: "10px",
  },

  acceptButton: {
    position: "absolute",
    left: "50%",
    background: `linear-gradient(135deg, ${theme.palette.mode === "light" ? "#1abc9c" : "#007bff"} 0%, ${theme.palette.mode === "light" ? "#16a085" : "#0056b3"} 100%)`,
    color: "white",
    borderRadius: "20px",
    fontWeight: "bold",
    "&:hover": {
      background: `linear-gradient(135deg, ${theme.palette.mode === "light" ? "#16a085" : "#0056b3"} 0%, ${theme.palette.mode === "light" ? "#1abc9c" : "#007bff"} 100%)`,
      transform: "scale(1.05)",
    },
  },

  ticketQueueColor: {
    flex: "none",
    width: "6px",
    height: "calc(100% - 8px)",
    position: "absolute",
    top: "4px",
    left: "4px",
    borderRadius: "3px",
  },
}));

const TicketListItem = ({ ticket }) => {
  const classes = useStyles();
  const history = useHistory();
  const [loading, setLoading] = useState(false);
  const { ticketId } = useParams();
  const isMounted = useRef(true);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const handleAcepptTicket = async (ticket) => {
    setLoading(true);
    try {
      await api.put(`/tickets/${ticket.id}`, {
        status: "open",
        userId: user?.id,
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
  console.log("🚀 Console Log : ticket.lastMessage", ticket.lastMessage);

  const handleSelectTicket = (ticket) => {
    history.push(`/tickets/${ticket.uuid}`);
  };

  return (
    <React.Fragment key={ticket.id}>
      <ListItem
        dense
        button
        onClick={(e) => {
          if (ticket.status === "pending") return;
          handleSelectTicket(ticket);
        }}
        selected={ticketId && +ticketId === ticket.id}
        className={clsx(classes.ticket, {
          [classes.pendingTicket]: ticket.status === "pending",
        })}
      >
        <Tooltip
          arrow
          placement="right"
          title={ticket.queue?.name || "Sem fila"}
        >
          <span
            style={{ backgroundColor: ticket.queue?.color || "#7C7C7C" }}
            className={classes.ticketQueueColor}
          ></span>
        </Tooltip>
        <ListItemAvatar>
          <Avatar src={ticket?.contact?.profilePicUrl} />
        </ListItemAvatar>
        <ListItemText
          disableTypography
          primary={
            <span className={classes.contactNameWrapper}>
              <Typography
                noWrap
                component="span"
                variant="body2"
                color="textPrimary"
              >
                {ticket.contact.name}
              </Typography>
              {ticket.status === "closed" && (
                <Badge
                  className={classes.closedBadge}
                  badgeContent={"closed"}
                  color="primary"
                />
              )}
{/*               {ticket.lastMessage && (
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
              )} */}
            </span>
          }
/*           secondary={
            <span className={classes.contactNameWrapper}>
              <Typography
                className={classes.contactLastMessage}
                noWrap
                component="span"
                variant="body2"
                color="textSecondary"
              >
                {ticket.lastMessage ? (
                  <MarkdownWrapper>{ticket.lastMessage}</MarkdownWrapper>
                ) : (
                  <MarkdownWrapper></MarkdownWrapper>
                )}
              </Typography>

              <Badge
                className={classes.newMessagesCount}
                badgeContent={ticket.unreadMessages}
                classes={{
                  badge: classes.badgeStyle,
                }}
              />
            </span>
          } */
        />
        {ticket.lastMessage ? (
  ticket.lastMessage.includes("VCARD") ? (
    <Typography>Novo contato recebido...</Typography>
  ) : (
    <MarkdownWrapper>{ticket.lastMessage}</MarkdownWrapper>
  )
) : (
  <br />
)}
        {ticket.status === "pending" && (
          <ButtonWithSpinner
            color="primary"
            variant="contained"
            className={classes.acceptButton}
            size="small"
            loading={loading}
            onClick={(e) => handleAcepptTicket(ticket)}
          >
            {i18n.t("ticketsList.buttons.accept")}
          </ButtonWithSpinner>
        )}
      </ListItem>
      <Divider variant="inset" component="li" />
    </React.Fragment>
  );
};

export default TicketListItem;
