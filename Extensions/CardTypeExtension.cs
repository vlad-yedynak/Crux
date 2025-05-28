using Crux.Models.EntityTypes;

namespace Crux.Extensions;

public static class CardTypeExtension
{
    public static string? ToString(this CardType type)
    {
        return type switch
        {
            CardType.Educational => nameof(CardType.Educational),
            CardType.Test => nameof(CardType.Test),
            CardType.Sandbox => nameof(CardType.Sandbox),
            _ => null
        };
    }

    public static CardType ToCardType(this string? type)
    {
        return type switch
        {
            nameof(CardType.Educational) => CardType.Educational,
            nameof(CardType.Test) => CardType.Test,
            nameof(CardType.Sandbox) => CardType.Sandbox,
            _ => CardType.Educational
        };
    }
}
