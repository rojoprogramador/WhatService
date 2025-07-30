import React, { useContext, useState } from "react";
import { useHistory } from "react-router-dom";

import { makeStyles, createTheme, ThemeProvider } from "@material-ui/core/styles";
import { IconButton } from "@material-ui/core";
import { MoreVert, Replay } from "@material-ui/icons";

import { i18n } from "../../translate/i18n";
import api from "../../services/api";
import TicketOptionsMenu from "../TicketOptionsMenu";
import ButtonWithSpinner from "../ButtonWithSpinner";
import toastError from "../../errors/toastError";
import { AuthContext } from "../../context/Auth/AuthContext";
import { TicketsContext } from "../../context/Tickets/TicketsContext";
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import UndoRoundedIcon from '@material-ui/icons/UndoRounded';
import Tooltip from '@material-ui/core/Tooltip';
import { green } from '@material-ui/core/colors';


const useStyles = makeStyles(theme => ({
	actionButtons: {
		marginRight: 6,
		flex: "none",
		alignSelf: "center",
		marginLeft: "auto",
		display: "flex",
		gap: "8px",
		"& > *": {
			margin: theme.spacing(0.2),
		},
	},
	modernButton: {
		borderRadius: "10px",
		padding: "8px 16px",
		fontWeight: "bold",
		textTransform: "none",
		boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
		transition: "all 0.3s ease",
		"&:hover": {
			transform: "translateY(-2px)",
			boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
		},
	},
	reopenButton: {
		background: "linear-gradient(135deg, #1abc9c 0%, #16a085 100%)",
		color: "white",
		"&:hover": {
			background: "linear-gradient(135deg, #16a085 0%, #1abc9c 100%)",
		},
	},
	returnIconButton: {
		backgroundColor: theme.palette.mode === "light" 
			? "rgba(0, 123, 255, 0.1)" 
			: "rgba(26, 188, 156, 0.1)",
		color: theme.palette.mode === "light" ? "#007bff" : "#1abc9c",
		borderRadius: "10px",
		padding: "8px",
		transition: "all 0.3s ease",
		"&:hover": {
			backgroundColor: theme.palette.mode === "light" 
				? "rgba(0, 123, 255, 0.2)" 
				: "rgba(26, 188, 156, 0.2)",
			transform: "scale(1.1)",
		},
	},
	resolveIconButton: {
		backgroundColor: "rgba(231, 76, 60, 0.1)",
		color: "#e74c3c",
		borderRadius: "10px",
		padding: "8px",
		transition: "all 0.3s ease",
		"&:hover": {
			backgroundColor: "rgba(231, 76, 60, 0.2)",
			transform: "scale(1.1)",
		},
	},
	moreOptionsButton: {
		backgroundColor: theme.palette.mode === "light" 
			? "rgba(108, 117, 125, 0.1)" 
			: "rgba(255, 255, 255, 0.1)",
		color: theme.palette.mode === "light" ? "#6c757d" : "#fff",
		borderRadius: "10px",
		padding: "8px",
		transition: "all 0.3s ease",
		"&:hover": {
			backgroundColor: theme.palette.mode === "light" 
				? "rgba(108, 117, 125, 0.2)" 
				: "rgba(255, 255, 255, 0.2)",
			transform: "scale(1.1)",
		},
	},
}));

const TicketActionButtonsCustom = ({ ticket }) => {
	const classes = useStyles();
	const history = useHistory();
	const [anchorEl, setAnchorEl] = useState(null);
	const [loading, setLoading] = useState(false);
	const ticketOptionsMenuOpen = Boolean(anchorEl);
	const { user } = useContext(AuthContext);
	const { setCurrentTicket } = useContext(TicketsContext);

	const customTheme = createTheme({
		palette: {
		  	primary: green,
		}
	});

	const handleOpenTicketOptionsMenu = e => {
		setAnchorEl(e.currentTarget);
	};

	const handleCloseTicketOptionsMenu = e => {
		setAnchorEl(null);
	};

	const handleUpdateTicketStatus = async (e, status, userId) => {
		setLoading(true);
		try {
			await api.put(`/tickets/${ticket.id}`, {
				status: status,
				userId: userId || null,
				useIntegration: status === "closed" ? false : ticket.useIntegration,
				promptId: status === "closed" ? false : ticket.promptId,
				integrationId: status === "closed" ? false : ticket.integrationId
			});

			setLoading(false);
			if (status === "open") {
				setCurrentTicket({ ...ticket, code: "#open" });
			} else {
				setCurrentTicket({ id: null, code: null })
				history.push("/tickets");
			}
		} catch (err) {
			setLoading(false);
			toastError(err);
		}
	};

	return (
		<div className={classes.actionButtons}>
			{ticket.status === "closed" && (
				<ButtonWithSpinner
					loading={loading}
					startIcon={<Replay />}
					size="small"
					onClick={e => handleUpdateTicketStatus(e, "open", user?.id)}
					className={`${classes.modernButton} ${classes.reopenButton}`}
				>
					{i18n.t("messagesList.header.buttons.reopen")}
				</ButtonWithSpinner>
			)}
			{ticket.status === "open" && (
				<>
					<Tooltip title={i18n.t("messagesList.header.buttons.return")} arrow>
						<IconButton 
							onClick={e => handleUpdateTicketStatus(e, "pending", null)}
							className={classes.returnIconButton}
						>
							<UndoRoundedIcon />
						</IconButton>
					</Tooltip>
					<Tooltip title={i18n.t("messagesList.header.buttons.resolve")} arrow>
						<IconButton 
							onClick={e => handleUpdateTicketStatus(e, "closed", user?.id)}
							className={classes.resolveIconButton}
						>
							<CheckCircleIcon />
						</IconButton>
					</Tooltip>
					{/* <ButtonWithSpinner
						loading={loading}
						startIcon={<Replay />}
						size="small"
						onClick={e => handleUpdateTicketStatus(e, "pending", null)}
					>
						{i18n.t("messagesList.header.buttons.return")}
					</ButtonWithSpinner>
					<ButtonWithSpinner
						loading={loading}
						size="small"
						variant="contained"
						color="primary"
						onClick={e => handleUpdateTicketStatus(e, "closed", user?.id)}
					>
						{i18n.t("messagesList.header.buttons.resolve")}
					</ButtonWithSpinner> */}
					<Tooltip title="Más opciones" arrow>
						<IconButton 
							onClick={handleOpenTicketOptionsMenu}
							className={classes.moreOptionsButton}
						>
							<MoreVert />
						</IconButton>
					</Tooltip>
					<TicketOptionsMenu
						ticket={ticket}
						anchorEl={anchorEl}
						menuOpen={ticketOptionsMenuOpen}
						handleClose={handleCloseTicketOptionsMenu}
					/>
				</>
			)}
			{ticket.status === "pending" && (
				<ButtonWithSpinner
					loading={loading}
					size="small"
					variant="contained"
					color="primary"
					onClick={e => handleUpdateTicketStatus(e, "open", user?.id)}
				>
					{i18n.t("messagesList.header.buttons.accept")}
				</ButtonWithSpinner>
			)}
		</div>
	);
};

export default TicketActionButtonsCustom;
