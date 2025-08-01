import React, { useState, useEffect, useReducer, useRef, useContext } from "react";

import { isSameDay, parseISO, format } from "date-fns";
import clsx from "clsx";

import { green } from "@material-ui/core/colors";
import {
  Button,
  CircularProgress,
  Divider,
  IconButton,
  makeStyles,
  Badge,
} from "@material-ui/core";

import {
  AccessTime,
  Block,
  Done,
  DoneAll,
  ExpandMore,
  GetApp,
  Reply,
} from "@material-ui/icons";

import MarkdownWrapper from "../MarkdownWrapper";
import ModalImageCors from "../ModalImageCors";
import MessageOptionsMenu from "../MessageOptionsMenu";
import whatsBackground from "../../assets/wa-background.png";
import LocationPreview from "../LocationPreview";
import whatsBackgroundDark from "../../assets/wa-background-dark.png"; //DARK MODE PLW DESIGN//
import VCardPreview from "../VCardPreview";
import api from "../../services/api";
import toastError from "../../errors/toastError";
import { SocketContext } from "../../context/Socket/SocketContext";
import { ForwardMessageContext } from "../../context/ForwarMessage/ForwardMessageContext";
import { ReplyMessageContext } from "../../context/ReplyingMessage/ReplyingMessageContext";
import SelectMessageCheckbox from "./SelectMessageCheckbox";

const useStyles = makeStyles((theme) => ({
  messagesListWrapper: {
    overflow: "hidden",
    position: "relative",
    display: "flex",
    flexDirection: "column",
    flexGrow: 1,
    width: "100%",
    minWidth: 300,
    minHeight: 200,
  },

  messagesList: {
    backgroundImage: theme.mode === 'light' ? `url(${whatsBackground})` : `url(${whatsBackgroundDark})`, //DARK MODE PLW DESIGN//
    display: "flex",
    flexDirection: "column",
    flexGrow: 1,
    padding: "20px 20px 20px 20px",
    overflowY: "scroll",
    ...theme.scrollbarStyles,
  },

  circleLoading: {
    color: theme.palette.mode === "light" ? "#1abc9c" : "#007bff",
    position: "absolute",
    opacity: "70%",
    top: 0,
    left: "50%",
    marginTop: 12,
  },

  messageLeft: {
    marginRight: 20,
    marginTop: 2,
    minWidth: 100,
    maxWidth: 600,
    height: "auto",
    display: "block",
    position: "relative",
    "&:hover #messageActionsButton": {
      display: "flex",
      position: "absolute",
      top: 0,
      right: 0,
    },

    whiteSpace: "pre-wrap",
    backgroundColor: "#ffffff",
    color: "#303030",
    alignSelf: "flex-start",
    borderTopLeftRadius: 0,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    paddingLeft: 5,
    paddingRight: 5,
    paddingTop: 5,
    paddingBottom: 0,
    boxShadow: "0 1px 1px #b3b3b3",
  },

  quotedContainerLeft: {
    margin: "-3px -80px 6px -6px",
    overflow: "hidden",
    backgroundColor: "#f0f0f0",
    borderRadius: "7.5px",
    display: "flex",
    position: "relative",
  },

  quotedMsg: {
    padding: 10,
    maxWidth: 300,
    height: "auto",
    display: "block",
    whiteSpace: "pre-wrap",
    overflow: "hidden",
  },

  quotedSideColorLeft: {
    flex: "none",
    width: "4px",
    backgroundColor: "#6bcbef",
  },

  messageRight: {
    marginLeft: 20,
    marginTop: 2,
    minWidth: 100,
    maxWidth: 600,
    height: "auto",
    display: "block",
    position: "relative",
    "&:hover #messageActionsButton": {
      display: "flex",
      position: "absolute",
      top: 0,
      right: 0,
    },

    whiteSpace: "pre-wrap",
    backgroundColor: "#dcf8c6",
    color: "#303030",
    alignSelf: "flex-end",
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 0,
    paddingLeft: 5,
    paddingRight: 5,
    paddingTop: 5,
    paddingBottom: 0,
    boxShadow: "0 1px 1px #b3b3b3",
  },

  quotedContainerRight: {
    margin: "-3px -80px 6px -6px",
    overflowY: "hidden",
    backgroundColor: "#cfe9ba",
    borderRadius: "7.5px",
    display: "flex",
    position: "relative",
  },

  quotedMsgRight: {
    padding: 10,
    maxWidth: 300,
    height: "auto",
    whiteSpace: "pre-wrap",
  },

  quotedSideColorRight: {
    flex: "none",
    width: "4px",
    backgroundColor: "#35cd96",
  },

  messageActionsButton: {
    display: "none",
    position: "relative",
    color: "#999",
    zIndex: 1,
    backgroundColor: "inherit",
    opacity: "90%",
    "&:hover, &.Mui-focusVisible": { backgroundColor: "inherit" },
  },

  messageContactName: {
    display: "flex",
    color: "#6bcbef",
    fontWeight: 500,
  },

  textContentItem: {
    overflowWrap: "break-word",
    padding: "3px 80px 6px 6px",
  },
  
  textContentItemEdited: {
    overflowWrap: "break-word",
    padding: "3px 120px 6px 6px",
  },

  textContentItemDeleted: {
    fontStyle: "italic",
    color: "rgba(0, 0, 0, 0.36)",
    overflowWrap: "break-word",
    padding: "3px 80px 6px 6px",
  },
  forwardMessage: {
    fontSize: 12,
    fontStyle: "italic",
    position: "absolute",
    top: 0,
    left: 5,
    color: "#999",
    display: "flex",
    alignItems: "center"
  },
  messageMedia: {
    objectFit: "cover",
    width: 250,
    height: 200,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },

  timestamp: {
    fontSize: 11,
    position: "absolute",
    bottom: 0,
    right: 5,
    color: "#999",
  },

  dailyTimestamp: {
    alignItems: "center",
    textAlign: "center",
    alignSelf: "center",
    width: "110px",
    backgroundColor: "#e1f3fb",
    margin: "10px",
    borderRadius: "10px",
    boxShadow: "0 1px 1px #b3b3b3",
  },

  dailyTimestampText: {
    color: "#808888",
    padding: 8,
    alignSelf: "center",
    marginLeft: "0px",
  },

  ackIcons: {
    fontSize: 18,
    verticalAlign: "middle",
    marginLeft: 4,
  },

  deletedIcon: {
    fontSize: 18,
    verticalAlign: "middle",
    marginRight: 4,
  },

  ackDoneAllIcon: {
    color: theme.palette.mode === "light" ? "#1abc9c" : "#007bff",
    fontSize: 18,
    verticalAlign: "middle",
    marginLeft: 4,
  },

  downloadMedia: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "inherit",
    padding: 10,
  },
}));

const reducer = (state, action) => {
  if (action.type === "LOAD_MESSAGES") {
    console.log('📥 LOAD_MESSAGES received:', action.payload.length, 'messages');
    const messages = action.payload;
    const newMessages = [];

    messages.forEach((message) => {
      const messageIndex = state.findIndex((m) => m.id === message.id);
      if (messageIndex !== -1) {
        state[messageIndex] = message;
      } else {
        newMessages.push(message);
      }
    });

    // Correct ordering: older messages first, then newer ones
    const result = [...state, ...newMessages];
    console.log('📥 After LOAD_MESSAGES, total messages:', result.length);
    return result;
  }

  if (action.type === "ADD_MESSAGE") {
    console.log('➕ ADD_MESSAGE received:', action.payload.id);
    const newMessage = action.payload;
    const messageIndex = state.findIndex((m) => m.id === newMessage.id);

    if (messageIndex !== -1) {
      console.log('✏️ Updating existing message');
      state[messageIndex] = newMessage;
    } else {
      console.log('🆕 Adding new message to end');
      state.push(newMessage);
    }

    const result = [...state];
    console.log('➕ After ADD_MESSAGE, total messages:', result.length);
    return result;
  }

  if (action.type === "UPDATE_MESSAGE") {
    console.log('🔄 UPDATE_MESSAGE received:', action.payload.id);
    const messageToUpdate = action.payload;
    const messageIndex = state.findIndex((m) => m.id === messageToUpdate.id);

    if (messageIndex !== -1) {
      state[messageIndex] = messageToUpdate;
    }

    return [...state];
  }

  if (action.type === "RESET") {
    console.log('🧹 RESET messages list');
    return [];
  }
};

const MessagesList = ({ ticket, ticketId, isGroup }) => {
  const classes = useStyles();

  const [messagesList, dispatch] = useReducer(reducer, []);
  const [pageNumber, setPageNumber] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const lastMessageRef = useRef();

  const [selectedMessage, setSelectedMessage] = useState({});
  const [anchorEl, setAnchorEl] = useState(null);
  const messageOptionsMenuOpen = Boolean(anchorEl);
  const currentTicketId = useRef(ticketId);
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  const socketManager = useContext(SocketContext);
  const { setReplyingMessage } = useContext(ReplyMessageContext);
  const { showSelectMessageCheckbox } = useContext(ForwardMessageContext);

  useEffect(() => {
    dispatch({ type: "RESET" });
    setPageNumber(1);

    console.log('🎯 MessagesList currentTicketId updated to:', ticketId);
    currentTicketId.current = ticketId;
  }, [ticketId]);

  useEffect(() => {
    setLoading(true);
    const delayDebounceFn = setTimeout(() => {
      const fetchMessages = async () => {
        if (ticketId === undefined) {
          console.log('❌ No ticketId provided');
          setLoading(false);
          return;
        }
        
        console.log('📡 Fetching messages for ticket:', ticketId, 'page:', pageNumber);
        
        try {
          const { data } = await api.get("/messages/" + ticketId, {
            params: { pageNumber },
          });

          console.log('📨 Received messages:', {
            ticketId,
            pageNumber,
            messagesCount: data.messages?.length || 0,
            hasMore: data.hasMore,
            currentTicketStillCurrent: currentTicketId.current === ticketId
          });

          if (currentTicketId.current === ticketId) {
            dispatch({ type: "LOAD_MESSAGES", payload: data.messages || [] });
            setHasMore(data.hasMore);
            setLoading(false);
            
            // Scroll to bottom only for first page load
            if (pageNumber === 1 && data.messages && data.messages.length > 0) {
              setTimeout(() => scrollToBottom(), 100);
            }
          } else {
            console.log('🚫 Ignoring messages - ticket changed during fetch');
            setLoading(false);
          }
        } catch (err) {
          console.error('❌ Error fetching messages:', err);
          setLoading(false);
          toastError(err);
        }
      };
      fetchMessages();
    }, 300); // Reduced delay for faster loading
    
    return () => {
      clearTimeout(delayDebounceFn);
    };
  }, [pageNumber, ticketId]);

  useEffect(() => {
    const companyId = localStorage.getItem("companyId");
    const socket = socketManager.getSocket(companyId);

    console.log('🔌 MessagesList setting up socket connection:', {
      companyId,
      ticketId: ticket.id,
      socketConnected: socket.connected,
      eventName: `company-${companyId}-appMessage`
    });

    socket.on("ready", () => {
      console.log('🔌 Socket ready, joining multiple rooms for ticket:', ticket.id, 'status:', ticket.status);
      
      // Unirse a la sala específica del ticket
      socket.emit("joinChatBox", `${ticket.id}`);
      
      // Unirse a las salas de estado del ticket para recibir mensajes desde celular
      if (ticket.status) {
        socket.emit("joinTickets", ticket.status);  // "closed", "open", "pending"
        console.log('🔌 Joined ticket status room:', ticket.status);
      }
      
      // Unirse a notificaciones de la company
      socket.emit("joinNotification");
      
      console.log('🔌 Joined rooms:', {
        ticketRoom: ticket.id,
        statusRoom: ticket.status,
        notificationRoom: 'company-notifications'
      });
    });

    socket.on("connect", () => {
      console.log('🔌 Socket connected to server');
    });

    socket.on("disconnect", () => {
      console.log('🔌 Socket disconnected from server');
    });

    socket.on(`company-${companyId}-appMessage`, (data) => {
      // Verificar si el mensaje pertenece a esta conversación
      const isCorrectTicket = String(data.message?.ticketId) === String(currentTicketId.current);
      
      // Para mensajes fromMe (enviados desde celular), verificar si el ticket del mensaje
      // corresponde al mismo contacto (por número de teléfono)
      const messageFromMe = data.message?.fromMe;
      const messageTicketContactNumber = data.ticket?.contact?.number;
      const currentTicketContactNumber = ticket?.contact?.number;
      const isFromMeToSameContact = messageFromMe && 
        messageTicketContactNumber === currentTicketContactNumber;
      
      // Para mensajes recibidos, verificar número del contacto
      const isSamePhoneNumber = !messageFromMe && 
        data.message?.contact?.number === ticket?.contact?.number;
      
      const shouldAddMessage = isCorrectTicket || isFromMeToSameContact || isSamePhoneNumber;
      
      console.log('📨 MessagesList received socket event company-' + companyId + '-appMessage:', {
        action: data.action,
        messageId: data.message?.id,
        messageBody: data.message?.body?.substring(0, 50) + '...',
        messageFromMe: data.message?.fromMe,
        messageTicketId: data.message?.ticketId,
        currentTicketId: currentTicketId.current,
        isCorrectTicket: isCorrectTicket,
        isFromMeToSameContact: isFromMeToSameContact,
        isSamePhoneNumber: isSamePhoneNumber,
        shouldAddMessage: shouldAddMessage,
        messageTicketContactNumber: messageTicketContactNumber,
        currentTicketContactNumber: currentTicketContactNumber,
        messageContactNumber: data.message?.contact?.number
      });

      // Log the full message object for debugging
      console.log('📨 Full message data:', data.message);
      console.log('📨 Full ticket data:', data.ticket);
      
      // DEBUGGING: Mostrar detalles exactos del mismatch
      console.log('🔍 TICKET ID COMPARISON DETAILS:', {
        messageTicketId: data.message?.ticketId,
        messageTicketIdType: typeof data.message?.ticketId,
        currentTicketId: currentTicketId.current,
        currentTicketIdType: typeof currentTicketId.current,
        stringMessageTicketId: String(data.message?.ticketId),
        stringCurrentTicketId: String(currentTicketId.current),
        exactMatch: String(data.message?.ticketId) === String(currentTicketId.current),
        contactNumbers: {
          messageContact: data.message?.contact?.number,
          currentTicketContact: ticket?.contact?.number
        },
        whatsappIds: {
          messageWhatsappId: data.message?.whatsappId,
          currentWhatsappId: ticket?.whatsappId
        },
        shouldAcceptMessage: shouldAddMessage,
        reasonForAcceptance: isCorrectTicket ? 'EXACT_TICKET_MATCH' : isSamePhoneNumber ? 'SAME_PHONE_NUMBER' : 'NO_MATCH'
      });
      
      if (data.action === "create" && shouldAddMessage) {
        let reason = 'UNKNOWN';
        if (isCorrectTicket) reason = 'EXACT_TICKET_MATCH';
        else if (isFromMeToSameContact) reason = 'FROM_ME_SAME_CONTACT';
        else if (isSamePhoneNumber) reason = 'SAME_PHONE_NUMBER';
        
        console.log('✅ Adding message to MessagesList:', {
          reason: reason,
          messageId: data.message.id,
          fromMe: data.message.fromMe,
          body: data.message.body?.substring(0, 30),
          ticketId: data.message.ticketId,
          dispatchingToReducer: true
        });
        dispatch({ type: "ADD_MESSAGE", payload: data.message });
        setTimeout(() => scrollToBottom(), 50);
        console.log('✅ Message dispatched successfully');
      } else if (data.action === "create") {
        console.log('❌ NOT adding message - no match:', {
          messageTicketId: data.message?.ticketId,
          currentTicketId: currentTicketId.current,
          isCorrectTicket: isCorrectTicket,
          isFromMeToSameContact: isFromMeToSameContact,
          isSamePhoneNumber: isSamePhoneNumber,
          messageFromMe: data.message?.fromMe,
          messageTicketContactNumber: messageTicketContactNumber,
          currentTicketContactNumber: currentTicketContactNumber,
          messageForDifferentConversation: true,
          action: data.action
        });
      }

      if (data.action === "update" && shouldAddMessage) {
        console.log('🔄 Updating message in MessagesList:', data.message.id);
        dispatch({ type: "UPDATE_MESSAGE", payload: data.message });
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [ticketId, ticket, socketManager]);

  const loadMore = () => {
    setPageNumber((prevPageNumber) => prevPageNumber + 1);
  };

  const scrollToBottom = () => {
    if (lastMessageRef.current) {
      lastMessageRef.current.scrollIntoView({});
    }
  };

  const handleScroll = (e) => {
    if (!hasMore) return;
    const { scrollTop } = e.currentTarget;

    if (scrollTop === 0) {
      document.getElementById("messagesList").scrollTop = 1;
    }

    if (loading) {
      return;
    }

    if (scrollTop < 50) {
      loadMore();
    }
  };

  const hanldeReplyMessage = (e, message) => {
    //if (ticket.status === "open" || ticket.status === "group") {
    setAnchorEl(null);
    setReplyingMessage(message);
    //}
  };

  const handleOpenMessageOptionsMenu = (e, message) => {
    setAnchorEl(e.currentTarget);
    setSelectedMessage(message);
  };

  const handleCloseMessageOptionsMenu = (e) => {
    setAnchorEl(null);
  };

  const checkMessageMedia = (message) => {
    if (message.mediaType === "locationMessage" && message.body.split('|').length >= 2) {
      let locationParts = message.body.split('|')
      let imageLocation = locationParts[0]
      let linkLocation = locationParts[1]

      let descriptionLocation = null

      if (locationParts.length > 2)
        descriptionLocation = message.body.split('|')[2]

      return <LocationPreview image={imageLocation} link={linkLocation} description={descriptionLocation} />
    }
    else
    if (message.mediaType === "contactMessage") {
      let array = message.body.split("\n");
      let obj = [];
      let contact = "";
      for (let index = 0; index < array.length; index++) {
        const v = array[index];
        let values = v.split(":");
        for (let ind = 0; ind < values.length; ind++) {
          if (values[ind].indexOf("+") !== -1) {
            obj.push({ number: values[ind] });
          }
          if (values[ind].indexOf("FN") !== -1) {
            contact = values[ind + 1];
          }
        }
      }
      //console.log(array);
      //console.log(contact);
      //console.log(obj[0].number);
      return <VCardPreview contact={contact} numbers={obj[0].number} />
    }
    /* else if (message.mediaType === "vcard") {
      let array = message.body.split("\n");
      let obj = [];
      let contact = "";
      for (let index = 0; index < array.length; index++) {
        const v = array[index];
        let values = v.split(":");
        for (let ind = 0; ind < values.length; ind++) {
          if (values[ind].indexOf("+") !== -1) {
            obj.push({ number: values[ind] });
          }
          if (values[ind].indexOf("FN") !== -1) {
            contact = values[ind + 1];
          }
        }
      }
      return <VcardPreview contact={contact} numbers={obj[0].number} />
    } */
    /*else if (message.mediaType === "multi_vcard") {
      console.log("multi_vcard")
      console.log(message)
      
      if(message.body !== null && message.body !== "") {
        let newBody = JSON.parse(message.body)
        return (
          <>
            {
            newBody.map(v => (
              <VcardPreview contact={v.name} numbers={v.number} />
            ))
            }
          </>
        )
      } else return (<></>)
    }*/
    else if (message.mediaType === "image") {
      return <ModalImageCors imageUrl={message.mediaUrl} />;
    } else if (message.mediaType === "audio") {

      //console.log(isIOS);

      if (isIOS) {
        message.mediaUrl = message.mediaUrl.replace("ogg", "mp3");

        return (
          <audio controls>
            <source src={message.mediaUrl} type="audio/mp3"></source>
          </audio>
        );
      } else {

        return (
          <audio controls>
            <source src={message.mediaUrl} type="audio/ogg"></source>
          </audio>
        );
      }
    } else if (message.mediaType === "video") {
      return (
        <video
          className={classes.messageMedia}
          src={message.mediaUrl}
          controls
        />
      );
    } else {
      return (
        <>
          <div className={classes.downloadMedia}>
            <Button
              startIcon={<GetApp />}
              color="primary"
              variant="outlined"
              target="_blank"
              href={message.mediaUrl}
            >
              Download
            </Button>
          </div>
          <Divider />
        </>
      );
    }
};

  /*
    const renderMessageAck = (message) => {
      if (message.ack === 1) {
        return <AccessTime fontSize="small" className={classes.ackIcons} />;
      }
      if (message.ack === 2) {
        return <Done fontSize="small" className={classes.ackIcons} />;
      }
      if (message.ack === 3) {
        return <DoneAll fontSize="small" className={classes.ackIcons} />;
      }
      if (message.ack === 4 || message.ack === 5) {
        return <DoneAll fontSize="small" className={classes.ackDoneAllIcon} />;
      }
    };
    */

    const renderMessageAck = (message) => {
      if (message.ack === 0) {
        return <AccessTime fontSize="small" className={classes.ackIcons} />;
      }
      if (message.ack === 1) {
        return <Done fontSize="small" className={classes.ackIcons} />;
      }
      if (message.ack === 2) {
        return <Done fontSize="small" className={classes.ackIcons} />;
      }
      if (message.ack === 3) {
        return <DoneAll fontSize="small" className={classes.ackIcons} />;
      }
      if (message.ack === 4 || message.ack === 5) {
        return <DoneAll fontSize="small" className={classes.ackDoneAllIcon} style={{color:'#0377FC'}} />;
      }
    };

  const renderDailyTimestamps = (message, index) => {
    if (index === 0) {
      return (
        <span
          className={classes.dailyTimestamp}
          key={`timestamp-${message.id}`}
        >
          <div className={classes.dailyTimestampText}>
            {format(parseISO(messagesList[index].createdAt), "dd/MM/yyyy")}
          </div>
        </span>
      );
    }
    if (index < messagesList.length - 1) {
      let messageDay = parseISO(messagesList[index].createdAt);
      let previousMessageDay = parseISO(messagesList[index - 1].createdAt);

      if (!isSameDay(messageDay, previousMessageDay)) {
        return (
          <span
            className={classes.dailyTimestamp}
            key={`timestamp-${message.id}`}
          >
            <div className={classes.dailyTimestampText}>
              {format(parseISO(messagesList[index].createdAt), "dd/MM/yyyy")}
            </div>
          </span>
        );
      }
    }
    if (index === messagesList.length - 1) {
      return (
        <div
          key={`ref-${message.createdAt}`}
          ref={lastMessageRef}
          style={{ float: "left", clear: "both" }}
        />
      );
    }
  };

  const renderNumberTicket = (message, index) => {
    if (index < messagesList.length && index > 0) {

      let messageTicket = message.ticketId;
      let connectionName = message.ticket?.whatsapp?.name;
      let previousMessageTicket = messagesList[index - 1].ticketId;

      if (messageTicket !== previousMessageTicket) {
        return (
          <center>
            <div className={classes.ticketNunberClosed}>
              Conversa encerrada: {format(parseISO(messagesList[index - 1].createdAt), "dd/MM/yyyy HH:mm:ss")}
            </div>

            <div className={classes.ticketNunberOpen}>
              Conversa iniciada: {format(parseISO(message.createdAt), "dd/MM/yyyy HH:mm:ss")}
            </div>
          </center>
        );
      }
    }
  };

  const renderMessageDivider = (message, index) => {
    if (index < messagesList.length && index > 0) {
      let messageUser = messagesList[index].fromMe;
      let previousMessageUser = messagesList[index - 1].fromMe;

      if (messageUser !== previousMessageUser) {
        return (
          <span style={{ marginTop: 16 }} key={`divider-${message.id}`}></span>
        );
      }
    }
  };

  const renderQuotedMessage = (message) => {
    return (
      <div
        className={clsx(classes.quotedContainerLeft, {
          [classes.quotedContainerRight]: message.fromMe,
        })}
      >
        <span
          className={clsx(classes.quotedSideColorLeft, {
            [classes.quotedSideColorRight]: message.quotedMsg?.fromMe,
          })}
        ></span>
        <div className={classes.quotedMsg}>
          {!message.quotedMsg?.fromMe && (
            <span className={classes.messageContactName}>
              {message.quotedMsg?.contact?.name}
            </span>
          )}

          {message.quotedMsg.mediaType === "audio"
            && (
              <div className={classes.downloadMedia}>
                <audio controls>
                  <source src={message.quotedMsg.mediaUrl} type="audio/ogg"></source>
                </audio>
              </div>
            )
          }
          {message.quotedMsg.mediaType === "video"
            && (
              <video
                className={classes.messageMedia}
                src={message.quotedMsg.mediaUrl}
                controls
              />
            )
          }
          {message.quotedMsg.mediaType === "application"
            && (
              <div className={classes.downloadMedia}>
                <Button
                  startIcon={<GetApp />}
                  color="primary"
                  variant="outlined"
                  target="_blank"
                  href={message.quotedMsg.mediaUrl}
                >
                  Download
                </Button>
              </div>
            )
          }

          {message.quotedMsg.mediaType === "image"
            && (
              <ModalImageCors imageUrl={message.quotedMsg.mediaUrl} />)
            || message.quotedMsg?.body}

        </div>
      </div>
    );
  };

  const renderMessages = () => {
    console.log('🎨 renderMessages called with:', {
      messagesCount: messagesList.length,
      messages: messagesList.map(m => ({ id: m.id, body: m.body?.substring(0, 20), fromMe: m.fromMe }))
    });
    
    if (messagesList.length > 0) {
      const viewMessagesList = messagesList.map((message, index) => {
        console.log('🎨 Rendering message:', { 
          id: message.id, 
          body: message.body?.substring(0, 30), 
          fromMe: message.fromMe,
          mediaType: message.mediaType 
        });

        if (message.mediaType === "call_log") {
          return (
            <React.Fragment key={message.id}>
              {renderDailyTimestamps(message, index)}
              {renderNumberTicket(message, index)}
              {renderMessageDivider(message, index)}
              <div className={classes.messageCenter}>
                <IconButton
                  variant="contained"
                  size="small"
                  id="messageActionsButton"
                  disabled={message.isDeleted}
                  className={classes.messageActionsButton}
                  onClick={(e) => handleOpenMessageOptionsMenu(e, message)}
                >
                  <ExpandMore />
                </IconButton>
                {isGroup && (
                  <span className={classes.messageContactName}>
                    {message.contact?.name}
                  </span>
                )}
                <div>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 17" width="20" height="17">
                    <path fill="#df3333" d="M18.2 12.1c-1.5-1.8-5-2.7-8.2-2.7s-6.7 1-8.2 2.7c-.7.8-.3 2.3.2 2.8.2.2.3.3.5.3 1.4 0 3.6-.7 3.6-.7.5-.2.8-.5.8-1v-1.3c.7-1.2 5.4-1.2 6.4-.1l.1.1v1.3c0 .2.1.4.2.6.1.2.3.3.5.4 0 0 2.2.7 3.6.7.2 0 1.4-2 .5-3.1zM5.4 3.2l4.7 4.6 5.8-5.7-.9-.8L10.1 6 6.4 2.3h2.5V1H4.1v4.8h1.3V3.2z"></path>
                  </svg> <span>Chamada de voz/vídeo perdida às {format(parseISO(message.createdAt), "HH:mm")}</span>
                </div>
              </div>
            </React.Fragment>
          );
        }

        if (!message.fromMe) {
          return (
            <React.Fragment key={message.id}>
              {renderDailyTimestamps(message, index)}
              {renderNumberTicket(message, index)}
              {renderMessageDivider(message, index)}
              <div
                className={classes.messageLeft}
                title={message.queueId && message.queue?.name}
                onDoubleClick={(e) => hanldeReplyMessage(e, message)}
              >
                {showSelectMessageCheckbox && (
                  <SelectMessageCheckbox
                    // showSelectMessageCheckbox={showSelectMessageCheckbox}
                    message={message}
                  // selectedMessagesList={selectedMessagesList}
                  // setSelectedMessagesList={setSelectedMessagesList}
                  />
                )}
                <IconButton
                  variant="contained"
                  size="small"
                  id="messageActionsButton"
                  disabled={message.isDeleted}
                  className={classes.messageActionsButton}
                  onClick={(e) => handleOpenMessageOptionsMenu(e, message)}
                >
                  <ExpandMore />
                </IconButton>
                {message.isForwarded && (
                  <div>
                    <span className={classes.forwardMessage}
                    ><Reply style={{ color: "grey", transform: 'scaleX(-1)' }} /> Encaminhada
                    </span>
                    <br />
                  </div>
                )}
                {isGroup && (
                  <span className={classes.messageContactName}>
                    {message.contact?.name}
                  </span>
                )}

                {/* aviso de mensagem apagado pelo contato */}
                {message.isDeleted && (
                  <div>
                    <span className={"message-deleted"}
                    >Essa mensagem foi apagada pelo contato &nbsp;
                      <Block
                        color="error"
                        fontSize="small"
                        className={classes.deletedIcon}
                      />
                    </span>
                  </div>
                )}

                {(message.mediaUrl || message.mediaType === "locationMessage" || message.mediaType === "vcard" || message.mediaType === "contactMessage"
                  //|| message.mediaType === "multi_vcard" 
                ) && checkMessageMedia(message)}
                <div className={classes.textContentItem}>
                  {message.quotedMsg && renderQuotedMessage(message)}
                  {message.mediaType !== "reactionMessage" && (
                    <MarkdownWrapper>
                      {message.mediaType === "locationMessage" || message.mediaType === "contactMessage" 
                        ? null
                        : message.body}
                    </MarkdownWrapper>
                  )}
                  {message.quotedMsg && message.mediaType === "reactionMessage" && message.body && (
                    <>
                      <span style={{ marginLeft: "0px", display: 'flex', alignItems: 'center' }}>
                        <MarkdownWrapper>
                          {"_*" + (message.fromMe ? 'Você' : (message?.contact?.name ?? 'Contato')) + "*_ reagiu... "}
                        </MarkdownWrapper>
                        <Badge 
                          className={classes.badge}
                          overlap="circular"
                          anchorOrigin={{
                            vertical: 'bottom',
                            horizontal: 'right',
                          }}
                          badgeContent={
                            <span style={{ fontSize: "1.2em", marginTop: "0", marginLeft: "5px" }}>
                              {message.body}
                            </span>
                          }
                        >
                        </Badge>
                      </span>
                    </>
                  )}
                                  
                  <span className={classes.timestamp}>
                    {format(parseISO(message.createdAt), "HH:mm")}
                  </span>
                </div>
              </div>
            </React.Fragment>
          );
        } else {
          return (
            <React.Fragment key={message.id}>
              {renderDailyTimestamps(message, index)}
              {renderNumberTicket(message, index)}
              {renderMessageDivider(message, index)}
              <div className={classes.messageRight}
              onDoubleClick={(e) => hanldeReplyMessage(e, message)}
            >
              {showSelectMessageCheckbox && (
                <SelectMessageCheckbox
                  // showSelectMessageCheckbox={showSelectMessageCheckbox}
                  message={message}
                // selectedMessagesList={selectedMessagesList}
                // setSelectedMessagesList={setSelectedMessagesList}
                />
              )}
                <IconButton
                  variant="contained"
                  size="small"
                  id="messageActionsButton"
                  disabled={message.isDeleted}
                  className={classes.messageActionsButton}
                  onClick={(e) => handleOpenMessageOptionsMenu(e, message)}
                >
                  <ExpandMore />
                </IconButton>
                {message.isForwarded && (
                  <div>
                    <span className={classes.forwardMessage}
                    ><Reply style={{ color: "grey", transform: 'scaleX(-1)' }} /> Encaminhada
                    </span>
                    <br />
                  </div>
                )}
                {(message.mediaUrl || message.mediaType === "locationMessage" || message.mediaType === "vcard" || message.mediaType === "contactMessage"
                  //|| message.mediaType === "multi_vcard" 
                ) && checkMessageMedia(message)}
                <div
                  className={clsx(classes.textContentItem, {
                    [classes.textContentItemDeleted]: message.isDeleted,
                  })}
                >
                  {message.isDeleted && (
                    <Block
                      color="disabled"
                      fontSize="small"
                      className={classes.deletedIcon}
                    />
                  )}
                  {message.quotedMsg && renderQuotedMessage(message)}
                  {message.mediaType !== "reactionMessage" && message.mediaType !== "locationMessage" && (
                    <MarkdownWrapper>{message.body}</MarkdownWrapper>
                  )}
                  {message.quotedMsg && message.mediaType === "reactionMessage" && message.body && (
                    <>
                      <span style={{ marginLeft: "0px", display: 'flex', alignItems: 'center' }}>
                        <MarkdownWrapper>
                          {"_*" + (message.fromMe ? 'Você' : (message?.contact?.name ?? 'Contato')) + "*_ reagiu... "}
                        </MarkdownWrapper>
                        <Badge 
                          className={classes.badge}
                          overlap="circular"
                          anchorOrigin={{
                            vertical: 'bottom',
                            horizontal: 'right',
                          }}
                          badgeContent={
                            <span style={{ fontSize: "1.2em", marginTop: "0", marginLeft: "5px" }}>
                              {message.body}
                            </span>
                          }
                        >
                        </Badge>
                      </span>
                    </>
                  )}
                  
                
                  <span className={classes.timestamp}>
                    {format(parseISO(message.createdAt), "HH:mm")}
                    {renderMessageAck(message)}
                  </span>
                </div>
              </div>
            </React.Fragment>
          );
        }
      });
      return viewMessagesList;
    } else {
      return <div>Diga olá para seu novo contato!</div>;
    }
  };

  return (
    <div className={classes.messagesListWrapper}>
      <MessageOptionsMenu
        message={selectedMessage}
        anchorEl={anchorEl}
        menuOpen={messageOptionsMenuOpen}
        handleClose={handleCloseMessageOptionsMenu}
      />
      <div
        id="messagesList"
        className={classes.messagesList}
        onScroll={handleScroll}
      >
        {console.log('🎨 Rendering messagesList:', {
          messagesListLength: messagesList.length,
          hasMessages: messagesList.length > 0,
          firstMessage: messagesList[0]?.id,
          lastMessage: messagesList[messagesList.length - 1]?.id
        })}
        {messagesList.length > 0 ? renderMessages() : (
          <div>📭 No hay mensajes para mostrar (messagesList.length = {messagesList.length})</div>
        )}
      </div>
      {loading && (
        <div>
          <CircularProgress className={classes.circleLoading} />
        </div>
      )}
    </div>
  );
};

export default MessagesList;