using Crux.Models.EntityTypes;

namespace Crux.Extensions;

public static class SandboxCardTypeExtension
{
    public static string? ToString(this SandboxCardType type)
    {
        return type switch
        {
            SandboxCardType.CoordinateSystem => nameof(SandboxCardType.CoordinateSystem),
            SandboxCardType.FractalSystem => nameof(SandboxCardType.FractalSystem),
            SandboxCardType.ColorSystem => nameof(SandboxCardType.ColorSystem),
            _ => null
        };
    }

    public static SandboxCardType ToSandboxCardType(this string? type)
    {
        return type switch
        {
            nameof(SandboxCardType.CoordinateSystem) => SandboxCardType.CoordinateSystem,
            nameof(SandboxCardType.FractalSystem) => SandboxCardType.FractalSystem,
            nameof(SandboxCardType.ColorSystem) => SandboxCardType.ColorSystem,
            _ => SandboxCardType.CoordinateSystem
        };
    }
}
