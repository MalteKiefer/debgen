 <?php

class Changes
{
    public function __construct($db)
    {
        $this->db = $db;
    }
    
    public function getChangesDate() {
		try {

		  $stmt = $this->db->prepare('SELECT DISTINCT lc_date FROM lastchanges ORDER BY lc_date DESC');
		  $stmt->execute();

		  return $stmt->fetchAll(PDO::FETCH_ASSOC);

		} catch(PDOException $e) {
		  echo $e->getMessage();

		}
	}
	
    public function getChanges($date) {
		try {

		  $stmt = $this->db->prepare('SELECT lc_id, lc_date, lc_text FROM lastchanges WHERE lc_date = ?');
		  $stmt->bindParam('1', $date);
		  $stmt->execute();

		  return $stmt->fetchAll(PDO::FETCH_ASSOC);

		} catch(PDOException $e) {
		  echo $e->getMessage();

		}
	}
	
}
?>
