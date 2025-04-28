using Crux.Models;

namespace Crux.Extensions;

public static class UserRoleExtension
{
    public static string? ToString(this UserRole role)
    {
        return role switch
        {
            UserRole.Admin => nameof(UserRole.Admin),
            UserRole.User => nameof(UserRole.User),
            _ => null
        };
    }

    public static UserRole ToUserRole(this string? role)
    {
        return role switch
        {
            nameof(UserRole.Admin) => UserRole.Admin,
            nameof(UserRole.User) => UserRole.User,
            _ => UserRole.User
        };
    }
}
