import { admins } from "./admins";
import { bookList } from "./bookList";
import { books } from "./books";
import { borrow } from "./borrow";
import { checklists } from "./checklists";
import { common } from "./common";
import { copies } from "./copies";
import { dashboard } from "./dashboard";
import { delivery } from "./delivery";
import { footer } from "./footer";
import { history } from "./history";
import { home } from "./home";
import { logs } from "./logs";
import { moderators } from "./moderators";
import { nav } from "./nav";
import { notifications } from "./notifications";
import { overview } from "./overview";
import { profile } from "./profile";
import { report } from "./report";
import { returnPage } from "./return";
import { thanas } from "./thanas";
import { transactions } from "./transactions";
import { users } from "./users";

export const en = {
  common,
  nav,
  home,
  footer,
  dashboard,
  overview,
  bookList,
  books,
  copies,
  users,
  admins,
  moderators,
  thanas,
  logs,
  profile,
  report,
  borrow,
  return: returnPage,
  history,
  transactions,
  notifications,
  checklists,
  delivery,
} as const;
