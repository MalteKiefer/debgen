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
