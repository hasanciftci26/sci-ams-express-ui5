SCHEMA {
    countryCode: String,

    $user: {
        user_uuid: String,
        scim_id: String,
        groups: String[],
        email: String,
        userRegion: String
    }    
}