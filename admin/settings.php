<?php

if(isset($_POST['changeNotify']))
{

    $status = ($_POST['notify']) ? 1 : 0;
    if($user->changeNotify($status))
    {
        require_once('../tpl/success.notify.php'); 
    }

}



$notify = $user->getNotify();

require_once('../tpl/settings.php');

