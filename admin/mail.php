<?php

if(isset($_POST['changeMail']))
{
    if(trim($_POST['mail']) != '')
    {
        if($user->changeMail($_POST['mail']))
        {
            require_once('../tpl/success.mail.php'); 
        }
        else
        {
            require_once('../tpl/error.mail.php'); 
        }
    }
    else
    {
        require_once('../tpl/error.mail.php');   
    }
}

$email = $user->getMail();

require_once('../tpl/mail.php');


