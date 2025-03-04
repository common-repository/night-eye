<?php

// autoload_static.php @generated by Composer

namespace Composer\Autoload;

class ComposerStaticInit6d99a82b70b8ffbc60a256eddf52f350
{
    public static $prefixLengthsPsr4 = array (
        'N' => 
        array (
            'NightEye\\' => 9,
        ),
    );

    public static $prefixDirsPsr4 = array (
        'NightEye\\' => 
        array (
            0 => __DIR__ . '/../../..' . '/night-eye',
        ),
    );

    public static $classMap = array (
        'Composer\\InstalledVersions' => __DIR__ . '/..' . '/composer/InstalledVersions.php',
    );

    public static function getInitializer(ClassLoader $loader)
    {
        return \Closure::bind(function () use ($loader) {
            $loader->prefixLengthsPsr4 = ComposerStaticInit6d99a82b70b8ffbc60a256eddf52f350::$prefixLengthsPsr4;
            $loader->prefixDirsPsr4 = ComposerStaticInit6d99a82b70b8ffbc60a256eddf52f350::$prefixDirsPsr4;
            $loader->classMap = ComposerStaticInit6d99a82b70b8ffbc60a256eddf52f350::$classMap;

        }, null, ClassLoader::class);
    }
}
