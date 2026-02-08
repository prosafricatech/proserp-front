import moment from 'moment';
import { USE_IMAGE_PLACEHOLDERS } from '../constants/paths';

export const getCustomDateTime = (
  value: number = 0,
  unit: moment.unitOfTime.DurationConstructor = 'days',
  format: string = 'HH:mm a | MMMM DD, YYYY'
) => {
  if (value === 0) {
    return moment().format(format);
  } else {
    return moment().add(value, unit).format(format);
  }
};

export const getDateElements = (date: string) => {
  const dateString = moment(date).format('dddd, MMMM DD YYYY, hh:mm A');
  const dateSections = dateString.split(',');
  const day = dateSections[0];
  const time = dateSections[2];
  const datePart = dateSections[1].trim().split(' ');
  return {
    day,
    time,
    date: {
      dateString: dateSections[1],
      month: datePart[0],
      date: datePart[1],
      year: datePart[2],
    },
  };
};

export const getAssetPath = (url: string, size?: string) => {
  if (USE_IMAGE_PLACEHOLDERS) {
    return `https://via.placeholder.com/${size}.png`;
  }

  return url;
};

export const timeSince = (days: number) => {
  let calcDate = new Date(Date.now() - days * 24 * 3600 * 1000);
  let seconds = Math.floor((new Date().getTime() - calcDate.getTime()) / 1000);

  let interval = seconds / 31536000;

  if (interval > 1) {
    return Math.floor(interval) + 'y ago';
  }
  interval = seconds / 2592000;
  if (interval > 1) {
    return Math.floor(interval) + 'm ago';
  }
  interval = seconds / 86400;
  if (interval > 1) {
    return Math.floor(interval) + 'd ago';
  }
  interval = seconds / 3600;
  if (interval > 1) {
    return Math.floor(interval) + 'h ago';
  }
  interval = seconds / 60;
  if (interval > 1) {
    return Math.floor(interval) + 'm ago';
  }
  return Math.floor(seconds) + 's ago';
};

export const isValidEmail = (emailAddress: string) => {
  const pattern = new RegExp(
    /^(("[\w-\s]+")|([\w-]+(?:\.[\w-]+)*)|("[\w-\s]+")([\w-]+(?:\.[\w-]+)*))(@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$)|(@\[?((25[0-5]\.|2[0-4][0-9]\.|1[0-9]{2}\.|[0-9]{1,2}\.))((25[0-5]|2[0-4][0-9]|1[0-9]{2}|[0-9]{1,2})\.){2}(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[0-9]{1,2})\]?$)/i
  );
  return pattern.test(emailAddress);
};

export const maskCardNumber = (cardNumber: string) => {
  // Get the last 4 digits
  const lastFour = cardNumber?.slice(-4);

  // Mask the first 12 digits and format with dashes
  const masked = 'xxxx-xxxx-xxxx-' + lastFour;

  return masked;
};

export const getColor: any = (status: string) => {
  switch (status) {
    case 'due':
      return 'warning';
    case 'paid':
      return 'success';
    case 'invited':
      return 'default';
    case 'active':
      return 'success';
  }
};
