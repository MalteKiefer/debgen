 <?php

class Repo
{
    public function __construct($db)
    {
        $this->db = $db;
    }
    
    public function getRelease() {
		try {

		  $stmt = $this->db->prepare('SELECT release_id, release_code, release_name FROM deb_release');
		  $stmt->execute();

		  return $stmt->fetchAll(PDO::FETCH_ASSOC);

		} catch(PDOException $e) {
		  echo $e->getMessage();

		}
	}
	
    public function getRepos() {
		try {

		  $stmt = $this->db->prepare('SELECT repo_id, repo_name, repo_desc, repo_url, repo_url_src, repo_gpg, repo_arch, repo_homepage, repo_documentation, repo_release, repo_checked FROM repos ORDER BY repo_name ASC');
		  $stmt->execute();

		  return $stmt->fetchAll(PDO::FETCH_ASSOC);

		} catch(PDOException $e) {
		  echo $e->getMessage();

		}
	}
	
    public function getRepo($id) {
		try {

		  $stmt = $this->db->prepare('SELECT repo_id, repo_name, repo_desc, repo_url, repo_url_src, repo_gpg, repo_arch, repo_homepage, repo_documentation, repo_release, repo_checked FROM repos WHERE repo_id = ?');
		  $stmt->bindParam('1', $id);
		  $stmt->execute();

		  return $stmt->fetchObject();

		} catch(PDOException $e) {
		  echo $e->getMessage();

		}
	}
	
    public function setRepoBroken($id, $key) {
		try {

		  $stmt = $this->db->prepare('UPDATE repos SET issue = 1 , issue_key = ? WHERE repo_id = ?');
		  $stmt->bindParam('1', $key);
		  $stmt->bindParam('2', $id);
		  $stmt->execute();

		  return true;

		} catch(PDOException $e) {
		  echo $e->getMessage();

		}
	}
	
    public function feedback($mail, $subject, $message) {
		$to = "malte.kiefer@mailgermania.de";
		$subject2 = "DebGen SourcesList: ".$subject;
		$message2 = $message."\n\n--\nThis message was sent to you by the DebGen SourcesList site!";

		mail($to,$subject2,$message2,"From: ".$mail);
	}
}
?>
