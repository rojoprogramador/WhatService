import React, { useState, useEffect } from "react";
import { useHistory } from "react-router-dom";
import { makeStyles } from "@material-ui/core/styles";
import Paper from "@material-ui/core/Paper";

import { i18n } from "../../translate/i18n";
import { Button, CircularProgress, Grid, TextField, Typography } from "@material-ui/core";
import { Field, Form, Formik } from "formik";
import toastError from "../../errors/toastError";
import { toast } from "react-toastify";
// import api from "../../services/api";
import axios from "axios";
import usePlans from "../../hooks/usePlans";

const useStyles = makeStyles((theme) => ({
  mainPaper: {
    flex: 1,
    padding: theme.spacing(2),
    paddingBottom: 100
  },
  mainHeader: {
    marginTop: theme.spacing(1),
  },
  elementMargin: {
    padding: theme.spacing(2),
  },
  formContainer: {
    maxWidth: 500,
  },
  textRight: {
    textAlign: "right"
  }
}));

const MessagesAPI = () => {
  const classes = useStyles();
  const history = useHistory();

  const [formMessageTextData,] = useState({ token: '', number: '', body: '' })
  const [formMessageMediaData,] = useState({ token: '', number: '', medias: '' })
  const [file, setFile] = useState({})

  const { getPlanCompany } = usePlans();

  useEffect(() => {
    async function fetchData() {
      const companyId = localStorage.getItem("companyId");
      if (!companyId || companyId === 'null' || companyId === 'undefined') {
        return;
      }
      
      try {
        const planConfigs = await getPlanCompany(undefined, companyId);
        if (planConfigs && planConfigs.plan && !planConfigs.plan.useExternalApi) {
          toast.error(i18n.t("announcements.permissions.noAccess"));
          setTimeout(() => {
            history.push(`/`)
          }, 1000);
        }
      } catch (error) {
        console.error('Error fetching plan configs:', error);
      }
    }
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getEndpoint = () => {
    return process.env.REACT_APP_BACKEND_URL + '/api/messages/send'
  }

  const handleSendTextMessage = async (values) => {
    const { number, body } = values;
    const data = { number, body };
    try {
      await axios.request({
        url: getEndpoint(),
        method: 'POST',
        data,
        headers: {
          'Content-type': 'application/json',
          'Authorization': `Bearer ${values.token}`
        }
      })
      toast.success(i18n.t('messagesAPI.messageSent'));
    } catch (err) {
      toastError(err);
    }
  }

  const handleSendMediaMessage = async (values) => {
    try {
      const firstFile = file[0];
      const data = new FormData();
      data.append('number', values.number);
      data.append('body', firstFile.name);
      data.append('medias', firstFile);
      await axios.request({
        url: getEndpoint(),
        method: 'POST',
        data,
        headers: {
          'Content-type': 'multipart/form-data',
          'Authorization': `Bearer ${values.token}`
        }
      })
      toast.success(i18n.t('messagesAPI.messageSent'));
    } catch (err) {
      toastError(err);
    }
  }

  const renderFormMessageText = () => {
    return (
      <Formik
        initialValues={formMessageTextData}
        enableReinitialize={true}
        onSubmit={(values, actions) => {
          setTimeout(async () => {
            await handleSendTextMessage(values);
            actions.setSubmitting(false);
            actions.resetForm()
          }, 400);
        }}
        className={classes.elementMargin}
      >
        {({ isSubmitting }) => (
          <Form className={classes.formContainer}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Field
                  as={TextField}
                  label={i18n.t("messagesAPI.textMessage.token")}
                  name="token"
                  autoFocus
                  variant="outlined"
                  margin="dense"
                  fullWidth
                  className={classes.textField}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Field
                  as={TextField}
                  label={i18n.t("messagesAPI.textMessage.number")}
                  name="number"
                  autoFocus
                  variant="outlined"
                  margin="dense"
                  fullWidth
                  className={classes.textField}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <Field
                  as={TextField}
                  label={i18n.t("messagesAPI.textMessage.body")}
                  name="body"
                  autoFocus
                  variant="outlined"
                  margin="dense"
                  fullWidth
                  className={classes.textField}
                  required
                />
              </Grid>
              <Grid item xs={12} className={classes.textRight}>
                <Button
                  type="submit"
                  color="primary"
                  variant="contained"
                  className={classes.btnWrapper}
                >
                  {isSubmitting ? (
                    <CircularProgress
                      size={24}
                      className={classes.buttonProgress}
                    />
                  ) : i18n.t('messagesAPI.send')}
                </Button>
              </Grid>
            </Grid>
          </Form>
        )}
      </Formik>
    )
  }

  const renderFormMessageMedia = () => {
    return (
      <Formik
        initialValues={formMessageMediaData}
        enableReinitialize={true}
        onSubmit={(values, actions) => {
          setTimeout(async () => {
            await handleSendMediaMessage(values);
            actions.setSubmitting(false);
            actions.resetForm()
            document.getElementById('medias').files = null
            document.getElementById('medias').value = null
          }, 400);
        }}
        className={classes.elementMargin}
      >
        {({ isSubmitting }) => (
          <Form className={classes.formContainer}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Field
                  as={TextField}
                  label={i18n.t("messagesAPI.mediaMessage.token")}
                  name="token"
                  autoFocus
                  variant="outlined"
                  margin="dense"
                  fullWidth
                  className={classes.textField}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Field
                  as={TextField}
                  label={i18n.t("messagesAPI.mediaMessage.number")}
                  name="number"
                  autoFocus
                  variant="outlined"
                  margin="dense"
                  fullWidth
                  className={classes.textField}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <input type="file" name="medias" id="medias" required onChange={(e) => setFile(e.target.files)} />
              </Grid>
              <Grid item xs={12} className={classes.textRight}>
                <Button
                  type="submit"
                  color="primary"
                  variant="contained"
                  className={classes.btnWrapper}
                >
                  {isSubmitting ? (
                    <CircularProgress
                      size={24}
                      className={classes.buttonProgress}
                    />
                  ) : i18n.t('messagesAPI.send')}
                </Button>
              </Grid>
            </Grid>
          </Form>
        )}
      </Formik>
    )
  }

  return (
    <Paper
      className={classes.mainPaper}
      style={{marginLeft: "5px"}}
      // className={classes.elementMargin}
      variant="outlined"
    >
      <Typography variant="h5">
        {i18n.t("messagesAPI.documentationTitle")}
      </Typography>
      <Typography variant="h6" color="primary" className={classes.elementMargin}>
        {i18n.t("messagesAPI.sendingMethods")}
      </Typography>
      <Typography component="div">
        <ol>
          <li>{i18n.t("messagesAPI.textMessagesItem")}</li>
          <li>{i18n.t("messagesAPI.mediaMessagesItem")}</li>
        </ol>
      </Typography>
      <Typography variant="h6" color="primary" className={classes.elementMargin}>
        {i18n.t("messagesAPI.instructions")}
      </Typography>
      <Typography className={classes.elementMargin} component="div">
        <b>{i18n.t("messagesAPI.importantNotes")}</b><br />
        <ul>
          <li>{i18n.t("messagesAPI.tokenRegistration")}</li>
          <li>
            {i18n.t("messagesAPI.numberFormat")}
            <ul>
              <li>{i18n.t("messagesAPI.countryCode")}</li>
              <li>{i18n.t("messagesAPI.areaCode")}</li>
              <li>{i18n.t("messagesAPI.phoneNumber")}</li>
            </ul>
          </li>
        </ul>
      </Typography>
      <Typography variant="h6" color="primary" className={classes.elementMargin}>
        {i18n.t("messagesAPI.textMessages")}
      </Typography>
      <Grid container>
        <Grid item xs={12} sm={6}>
          <Typography className={classes.elementMargin} component="div">
            <p>{i18n.t("messagesAPI.textInstructions")}</p>
            <b>{i18n.t("messagesAPI.endpoint")} </b> {getEndpoint()} <br />
            <b>{i18n.t("messagesAPI.method")} </b> POST <br />
            <b>{i18n.t("messagesAPI.headers")} </b> Authorization (Bearer token) e Content-Type (application/json) <br />
            <b>{i18n.t("messagesAPI.body")} </b> {"{ \"number\": \"595985523065\", \"body\": \"Sua mensagem\" }"}
          </Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography className={classes.elementMargin}>
            <b>{i18n.t("messagesAPI.testSend")}</b>
          </Typography>
          {renderFormMessageText()}
        </Grid>
      </Grid>
      <Typography variant="h6" color="primary" className={classes.elementMargin}>
        {i18n.t("messagesAPI.mediaMessages")}
      </Typography>
      <Grid container>
        <Grid item xs={12} sm={6}>
          <Typography className={classes.elementMargin} component="div">
            <p>{i18n.t("messagesAPI.textInstructions")}</p>
            <b>{i18n.t("messagesAPI.endpoint")} </b> {getEndpoint()} <br />
            <b>{i18n.t("messagesAPI.method")} </b> POST <br />
            <b>{i18n.t("messagesAPI.headers")} </b> Authorization (Bearer token) e Content-Type (multipart/form-data) <br />
            <b>FormData: </b> <br />
            <ul>
              <li>
                <b>number: </b> 5599999999999
              </li>
              <li>
                <b>medias: </b> arquivo
              </li>
            </ul>
          </Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography className={classes.elementMargin}>
            <b>{i18n.t("messagesAPI.testSend")}</b>
          </Typography>
          {renderFormMessageMedia()}
        </Grid>
      </Grid>
    </Paper>
  );
};

export default MessagesAPI;