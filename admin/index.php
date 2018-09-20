<?php
session_start();

require_once('../class/db.inc.php');
require_once('../class/class.user.php');

if(isset($_SESSION['userid']) AND isset($_SESSION['username']))
{
    require_once('tpl/header.tpl');
    require_once('tpl/menu.tpl');
    require_once('tpl/footer.tpl');
}
else
{
    require_once("login.php");
}