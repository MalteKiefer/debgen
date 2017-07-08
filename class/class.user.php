<?php

class User {

    public function __construct($db)
    {
        $this->db = $db;
    }
    
    public function createHash($value)
    {
        return password_hash($value, PASSWORD_DEFAULT);
    }

    public function changePassword($password)
    {
    
        $pwd = $this->createHash($password);
        try {
            $stmt = $this->db->prepare('UPDATE users SET password = ? WHERE uid = ?');
            $stmt->bindParam('1', $pwd);
            $stmt->bindParam('2', $_SESSION['userid']);
            $stmt->execute();

            return true;
        } catch (PDOException $e) {
            $$e->getMessage();
        }

    }
    
    public function changeMail($mail)
    {
    
        try {
            $stmt = $this->db->prepare('UPDATE users SET email = ? WHERE uid = ?');
            $stmt->bindParam('1', $mail);
            $stmt->bindParam('2', $_SESSION['userid']);
            $stmt->execute();

            return true;
        } catch (PDOException $e) {
            $$e->getMessage();
        }

    }
    
    public function changeNotify($notify)
    {
    
        try {
            $stmt = $this->db->prepare('UPDATE users SET notify = ? WHERE uid = ?');
            $stmt->bindParam('1', $notify);
            $stmt->bindParam('2', $_SESSION['userid']);
            $stmt->execute();

            return true;
        } catch (PDOException $e) {
            $$e->getMessage();
        }

    }
    
    public function getMail()
    {
    
        try {
            $stmt = $this->db->prepare('SELECT email FROM users WHERE uid = ?');
            $stmt->bindParam('1', $_SESSION['userid']);
            $stmt->execute();

            return $stmt->fetchObject();
        } catch (PDOException $e) {
            $$e->getMessage();
        }

    }
    
    public function getNotify()
    {
    
        try {
            $stmt = $this->db->prepare('SELECT notify FROM users WHERE uid = ?');
            $stmt->bindParam('1', $_SESSION['userid']);
            $stmt->execute();

            return $stmt->fetchObject();
        } catch (PDOException $e) {
            $$e->getMessage();
        }

    }

    public function loginUser($username, $password)
    {
        try {
            $stmt = $this->db->prepare('SELECT uid, password, username FROM users WHERE username = ?');
            $stmt->bindParam('1', $username);
            $stmt->execute();

            $row = $stmt->fetch();
        } catch (PDOException $e) {
            $$e->getMessage();
        }

        if (isset($row['password'])) {
            if (password_verify($password, $row['password'])) {
                $_SESSION['userid'] = $row['uid'];
                $_SESSION['username'] = $row['username'];
                return true;
            } else {
                return false;
            }
        } else {
            return false;
        }
    }
}
