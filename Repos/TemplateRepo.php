<?php

namespace NightEye\Repos;


class TemplateRepo
{
    private $db;

    public function __construct($wpdb)
    {
        $this->db = $wpdb;
    }

    public function getAll()
    {
        $templateModels = [];
        $fullTableName = $this->db->prefix . TemplateRepo::TABLE_NAME;
        $rows = $this->db->get_results(
            "
                SELECT *
                FROM $fullTableName
                ",
            ARRAY_A
        );

        foreach ($rows as $key => $row) {
            $templateModel = new TemplateModel();
            $templateModel->id = $row[TemplateRepo::ID];

            $templateModels[] = $templateModel;
        }

        return $templateModels;
    }

    public function save(TemplateModel &$model)
    {
        $fullTableName = $this->db->prefix . TemplateRepo::TABLE_NAME;

        $updateProps = array(
            TemplateRepo::UNIQUE_ID => $model->uniqueID,
        );

        $updatePropsTypes = array(
            '%s'
        );

        if ($model->id === SV::NOT_EXISTS) { // insert
            $success = $this->db->insert(
                $fullTableName,
                $updateProps,
                $updatePropsTypes);
            if ($success !== false) {
                $model->id = $this->db->insert_id;
            }
        } else { // update
            $this->db->update(
                $fullTableName,
                $updateProps,
                array(
                    TemplateRepo::ID => $model->id,
                ),
                $updatePropsTypes,
                array('%d')
            );
        }

    }

    public function remove(TemplateModel $model)
    {
        $fullTableName = $this->db->prefix . TemplateRepo::TABLE_NAME;
        $this->db->delete($fullTableName, array(TemplateRepo::ID => $model->id));
    }

}
