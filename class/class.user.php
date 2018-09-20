<?php

class User {
    public $USERID;
    public $USERNAME;
    public $PASSWORD;
    public $MAIL;
    public $CONN;

    function __construct($CONN) {
        $this->CONN = $CONN;
    }

    public function login(){
        $statement = $this->CONN->prepare("SELECT userid, password FROM user WHERE username = :username");
        $result = $statement->execute(array('username' => $this->USERNAME));
        $user = $statement->fetch();

        if(password_verify($this->PASSWORD, $user['password'])){
            $_SESSION['userid'] = $user['userid'];
            $_SESSION['username'] = $this->USERNAME;
            return TRUE;
        } else {
            return FALSE;
        }
    }
}
