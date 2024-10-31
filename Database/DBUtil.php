<?php
namespace NightEye\Database;

use NightEye\Database\Tables\TemplateTable;

class DBUtil
{

    const DB_VERSION_OPTION_NAME = 'db_version';
    const DB_VERSION = '1.0';

    private $_db = null;

    public function __construct($db = null)
    {
        global $wpdb;
        if ($db === null) {
            $this->db = $wpdb;
        } else {
            $this->db = $db;
        }

    }

    public function migrateDB()
    {
        $installed_ver = \get_option(self::DB_VERSION_OPTION_NAME);

        if ($installed_ver != self::DB_VERSION) {
            // require_once __DIR__ . '/tables/TemplateTable.php';

            //$this->createUpdateTable(TemplateTable::TABLE_NAME,TemplateTable::generateSQL());

            \update_option(self::DB_VERSION_OPTION_NAME, self::DB_VERSION);
        }

    }

    public function createUpdateTable($tableName, $sql)
    {

        $fullTableName = $this->db->prefix . $tableName;
        $charset_collate = $this->db->get_charset_collate();

        $sqlExecute = "CREATE TABLE $fullTableName (\n"
            . $sql
            . ") $charset_collate;";

        // Used for dbDelta
        require_once ABSPATH . 'wp-admin/includes/upgrade.php';
        \dbDelta($sqlExecute);
    }

    public function removeTables()
    {
        //$this->removeTable(TemplateTable::TABLE_NAME);
    }

    public function removeTable($tableName)
    {
        $fullTableName = $this->db->prefix . $tableName;
        $sqlExecute = "DROP TABLE IF EXISTS $fullTableName\n";

        // Used for dbDelta
        require_once ABSPATH . 'wp-admin/includes/upgrade.php';
        \dbDelta($sqlExecute);
    }

}
