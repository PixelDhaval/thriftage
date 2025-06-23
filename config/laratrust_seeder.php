<?php

return [
    /**
     * Control if all the laratrust tables should be truncated before running the seeder.
     */
    'truncate_tables' => true,

    'roles_structure' => [
        'superadministrator' => [
            'users' => 'c,r,u,d',
            'roles' => 'c,r,u,d',
            'permissions' => 'c,r,u,d',
            'teams' => 'c,r,u,d',
            'grades' => 'c,r,u,d',
            'items' => 'c,r,u,d',
            'parties' => 'c,r,u,d',
            'sections' => 'c,r,u,d',
            'weights' => 'c,r,u,d',
            'imports' => 'c,r,u,d',
            'import-bags' => 'c,r,u,d',
            'bags-opening' => 'r,u',
            'graded-bags-pools' => 'c,r,u,d',
            'graded-items-pools' => 'c,r,u,d',
        ],
        'owner' => [
            'users' => 'r,u',
            'grades' => 'c,r,u,d',
            'items' => 'c,r,u,d',
            'parties' => 'c,r,u,d',
            'sections' => 'c,r,u,d',
            'weights' => 'c,r,u,d',
            'imports' => 'c,r,u,d',
            'import-bags' => 'c,r,u,d',
            'bags-opening' => 'r,u',
            'graded-bags-pools' => 'c,r,u,d',
            'graded-items-pools' => 'c,r,u,d',
        ],
        'manager' => [
             'grades' => 'c,r,u,d',
            'items' => 'c,r,u,d',
            'parties' => 'c,r,u,d',
            'sections' => 'c,r,u,d',
            'weights' => 'c,r,u,d',
            'imports' => 'c,r,u,d',
            'import-bags' => 'c,r,u,d',
            'bags-opening' => 'r,u',
            'graded-bags-pools' => 'c,r,u,d',
            'graded-items-pools' => 'c,r,u,d',
        ],
    ],

    'permissions_map' => [
        'c' => 'create',
        'r' => 'read',
        'u' => 'update',
        'd' => 'delete',
    ],

    'create_users' => true,
];
