using CounterStrikeSharp.API;
using CounterStrikeSharp.API.Core;
using CounterStrikeSharp.API.Modules.UserMessages;

public static class Transmit
{
    public static void Load()
    {
        Plugin.Instance.RegisterListenerPinned<Listeners.CheckTransmit>(CheckTransmit);
        Plugin.Instance.HookUserMessagePinned(208, CMsgSosStartSoundEvent, HookMode.Pre);
    }

    public static void Unload()
    {
        Plugin.Instance.RemoveListenerPinned<Listeners.CheckTransmit>(CheckTransmit);
        Plugin.Instance.UnhookUserMessagePinned(208, CMsgSosStartSoundEvent, HookMode.Pre);
    }

    private static void CheckTransmit(CCheckTransmitInfoList infoList)
    {
        foreach ((CCheckTransmitInfo info, CCSPlayerController? player) in infoList)
        {
            if (player == null || !player.IsValid || !Building.Builders.ContainsKey(player.Slot))
                continue;

            foreach (var hidden in Blocks.HiddenPlayers)
            {
                if (hidden == null || !hidden.IsValid)
                    continue;

                var playerPawnHandle = player.Pawn;
                if (playerPawnHandle == null || !playerPawnHandle.IsValid || playerPawnHandle.Value == null || !playerPawnHandle.Value.IsValid)
                    continue;

                var playerPawnBase = playerPawnHandle.Value.As<CCSPlayerPawnBase>();
                if (playerPawnBase == null || !playerPawnBase.IsValid)
                    continue;

                if (player == hidden || playerPawnBase.PlayerState == CSPlayerState.STATE_OBSERVER_MODE)
                    continue;

                var hiddenPawnHandle = hidden.Pawn;
                if (hiddenPawnHandle == null || !hiddenPawnHandle.IsValid || hiddenPawnHandle.Value == null || !hiddenPawnHandle.Value.IsValid)
                    continue;

                var remove = hiddenPawnHandle.Value;
                info.TransmitEntities.Remove(remove);
            }
        }
    }

    private static HookResult CMsgSosStartSoundEvent(UserMessage um)
    {
        int entIndex = um.ReadInt("source_entity_index");
        var entity = Utilities.GetEntityFromIndex<CBaseEntity>(entIndex);
        if (entity == null || !entity.IsValid || entity.DesignerName != "player") return HookResult.Continue;

        var pawn = entity.As<CBasePlayerPawn>();
        if (pawn == null || !pawn.IsValid) return HookResult.Continue;

        var controllerHandle = pawn.Controller;
        if (controllerHandle == null || !controllerHandle.IsValid || controllerHandle.Value == null || !controllerHandle.Value.IsValid)
            return HookResult.Continue;

        var player = controllerHandle.Value.As<CCSPlayerController>();
        if (player == null || !player.IsValid) return HookResult.Continue;
   
        if (Blocks.HiddenPlayers.Contains(player))
        {
            foreach (var target in Utilities.GetPlayers())
            {
                if (target == null || !target.IsValid || target.NotValid()) continue;
                if (target == player) continue;

                um.Recipients.Remove(target);
            }
        }

        return HookResult.Continue;
    }
}