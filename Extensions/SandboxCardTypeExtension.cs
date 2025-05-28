using Crux.Models.EntityTypes;

namespace Crux.Extensions;

public static class SandboxCardTypeExtension
{
    public static string? ToString(this SandboxCardType type)
    {
        return type switch
        {
            SandboxCardType.Primitives => nameof(SandboxCardType.Primitives),
            SandboxCardType.Bezier => nameof(SandboxCardType.Bezier),
            SandboxCardType.FractalSystem => nameof(SandboxCardType.FractalSystem),
            SandboxCardType.ColorSystem => nameof(SandboxCardType.ColorSystem),
            SandboxCardType.Animation => nameof(SandboxCardType.Animation),
            _ => null
        };
    }

    public static SandboxCardType ToSandboxCardType(this string? type)
    {
        return type switch
        {
            nameof(SandboxCardType.Primitives) => SandboxCardType.Primitives,
            nameof(SandboxCardType.Bezier) => SandboxCardType.Bezier,
            nameof(SandboxCardType.FractalSystem) => SandboxCardType.FractalSystem,
            nameof(SandboxCardType.ColorSystem) => SandboxCardType.ColorSystem,
            nameof(SandboxCardType.Animation) => SandboxCardType.Animation,
            _ => SandboxCardType.Primitives
        };
    }
}
