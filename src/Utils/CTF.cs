using CounterStrikeSharp.API;
using CounterStrikeSharp.API.Core;
using CounterStrikeSharp.API.Core.Translations;
using CounterStrikeSharp.API.Modules.Entities.Constants;
using CounterStrikeSharp.API.Modules.Utils;
using FixVectorLeak;
using System;
using System.Drawing;
using System.Linq;

public static class CTFManager
{
    public static bool IsCTFActive { get; set; } = false;

    // Flag positions/states
    public static Vector_t? CTFlagBasePosition { get; set; }
    public static Vector_t? CTFlagCurrentPosition { get; set; }
    public static CBaseModelEntity? CTFlagBlockEntity { get; set; }
    public static CCSPlayerController? CTFlagCarrier { get; set; }
    public static bool IsCTFlagDropped { get; set; } = false;
    public static float CTFlagDroppedTime { get; set; } = 0f;

    public static Vector_t? TFlagBasePosition { get; set; }
    public static Vector_t? TFlagCurrentPosition { get; set; }
    public static CBaseModelEntity? TFlagBlockEntity { get; set; }
    public static CCSPlayerController? TFlagCarrier { get; set; }
    public static bool IsTFlagDropped { get; set; } = false;
    public static float TFlagDroppedTime { get; set; } = 0f;

    // Scores
    public static int CTScores { get; set; } = 0;
    public static int TScores { get; set; } = 0;

    // Freeze Line settings
    public static float FreezeRemaining { get; set; } = 15.0f;
    public static bool IsFreezeActive => FreezeRemaining > 0f;

    private static CounterStrikeSharp.API.Modules.Timers.Timer? _ctfTimer = null;

    public static void OnRoundStart()
    {
        // Kill existing timer if any
        if (_ctfTimer != null)
        {
            Plugin.Instance.KillTimer(_ctfTimer);
            _ctfTimer = null;
        }

        CTFlagCarrier = null;
        IsCTFlagDropped = false;
        CTFlagDroppedTime = 0f;

        TFlagCarrier = null;
        IsTFlagDropped = false;
        TFlagDroppedTime = 0f;

        CTScores = 0;
        TScores = 0;
        FreezeRemaining = 15.0f;
        IsCTFActive = false;

        // Scan entities to find CT Flag and T Flag blocks
        FindFlags();

        if (IsCTFActive)
        {
            // Reset block visual states and positions
            ResetFlags();
            ResetFreezeLines();

            Utils.PrintToChatAll("{purple}Capture the Flag gamemode detected! {grey}Capture the enemy flag and bring it back to your base. First to 3 wins.");
            Utils.PrintToChatAll("{orange}Freeze lines are active! {grey}You cannot cross them for the first 15 seconds.");

            // Start 1-second interval timer
            _ctfTimer = Plugin.Instance.StartTimer(1.0f, OnTimerTick, CounterStrikeSharp.API.Modules.Timers.TimerFlags.REPEAT | CounterStrikeSharp.API.Modules.Timers.TimerFlags.STOP_ON_MAPCHANGE);
        }
    }

    public static void OnRoundEnd()
    {
        if (_ctfTimer != null)
        {
            Plugin.Instance.KillTimer(_ctfTimer);
            _ctfTimer = null;
        }
    }

    public static void OnPlayerDeath(CCSPlayerController player)
    {
        if (!IsCTFActive) return;

        if (CTFlagCarrier == player)
        {
            DropCTFlag();
        }
        else if (TFlagCarrier == player)
        {
            DropTFlag();
        }
    }

    public static void OnPlayerDisconnect(CCSPlayerController player)
    {
        if (!IsCTFActive) return;

        if (CTFlagCarrier == player)
        {
            DropCTFlag();
        }
        else if (TFlagCarrier == player)
        {
            DropTFlag();
        }
    }

    private static void OnTimerTick()
    {
        // 1. Handle freeze time
        if (FreezeRemaining > 0f)
        {
            FreezeRemaining -= 1.0f;
            if (FreezeRemaining <= 0f)
            {
                DisableFreezeLines();
                Utils.PrintToChatAll("{orange}Freeze lines have deactivated! {grey}Go capture the enemy flag!");
            }
        }

        // 2. Handle carrier safety checks
        if (CTFlagCarrier != null)
        {
            if (!CTFlagCarrier.IsValid || !CTFlagCarrier.PlayerPawn.IsValid || CTFlagCarrier.Team != CsTeam.Terrorist || !CTFlagCarrier.PawnIsAlive)
            {
                DropCTFlag();
            }
        }
        if (TFlagCarrier != null)
        {
            if (!TFlagCarrier.IsValid || !TFlagCarrier.PlayerPawn.IsValid || TFlagCarrier.Team != CsTeam.CounterTerrorist || !TFlagCarrier.PawnIsAlive)
            {
                DropTFlag();
            }
        }

        // 3. Handle dropped flags timeouts
        if (IsCTFlagDropped)
        {
            CTFlagDroppedTime -= 1.0f;
            if (CTFlagDroppedTime <= 0f)
            {
                ReturnCTFlagToBase(null);
            }
        }
        if (IsTFlagDropped)
        {
            TFlagDroppedTime -= 1.0f;
            if (TFlagDroppedTime <= 0f)
            {
                ReturnTFlagToBase(null);
            }
        }

        // 4. Update HUD
        UpdateCTFHUD();
    }

    public static void FindFlags()
    {
        CTFlagBasePosition = null;
        TFlagBasePosition = null;
        CTFlagBlockEntity = null;
        TFlagBlockEntity = null;

        foreach (var kvp in Blocks.Entities)
        {
            var entity = kvp.Key;
            var data = kvp.Value;
            if (data.Type == "CT Flag")
            {
                CTFlagBlockEntity = entity as CBaseModelEntity;
                CTFlagBasePosition = entity.AbsOrigin?.ToVector_t();
                CTFlagCurrentPosition = CTFlagBasePosition;
                IsCTFActive = true;
            }
            else if (data.Type == "T Flag")
            {
                TFlagBlockEntity = entity as CBaseModelEntity;
                TFlagBasePosition = entity.AbsOrigin?.ToVector_t();
                TFlagCurrentPosition = TFlagBasePosition;
                IsCTFActive = true;
            }
        }
    }

    public static void ResetFlags()
    {
        if (CTFlagBlockEntity != null && CTFlagBlockEntity.IsValid && CTFlagBasePosition != null)
        {
            CTFlagBlockEntity.Teleport(CTFlagBasePosition);
            
            var data = Blocks.Entities[CTFlagBlockEntity];
            var clr = Utils.GetColor(data.Color);
            int alpha = Utils.GetAlpha(data.Transparency);
            CTFlagBlockEntity.Render = Color.FromArgb(alpha, clr.R, clr.G, clr.B);
            Utilities.SetStateChanged(CTFlagBlockEntity, "CBaseModelEntity", "m_clrRender");
            
            CTFlagBlockEntity.CollisionRulesChanged(CollisionGroup.COLLISION_GROUP_TRIGGER);
            CTFlagBlockEntity.AcceptInput("EnableCollision");
        }

        if (TFlagBlockEntity != null && TFlagBlockEntity.IsValid && TFlagBasePosition != null)
        {
            TFlagBlockEntity.Teleport(TFlagBasePosition);
            
            var data = Blocks.Entities[TFlagBlockEntity];
            var clr = Utils.GetColor(data.Color);
            int alpha = Utils.GetAlpha(data.Transparency);
            TFlagBlockEntity.Render = Color.FromArgb(alpha, clr.R, clr.G, clr.B);
            Utilities.SetStateChanged(TFlagBlockEntity, "CBaseModelEntity", "m_clrRender");
            
            TFlagBlockEntity.CollisionRulesChanged(CollisionGroup.COLLISION_GROUP_TRIGGER);
            TFlagBlockEntity.AcceptInput("EnableCollision");
        }
    }

    public static void ResetFreezeLines()
    {
        foreach (var kvp in Blocks.Entities)
        {
            var entity = kvp.Key as CBaseModelEntity;
            if (entity == null) continue;
            var data = kvp.Value;
            if (data.Type == "Freeze Line")
            {
                entity.CollisionRulesChanged(CollisionGroup.COLLISION_GROUP_NONE);
                entity.AcceptInput("EnableCollision");
                
                var clr = Utils.GetColor(data.Color);
                int alpha = Utils.GetAlpha(data.Transparency);
                entity.Render = Color.FromArgb(alpha, clr.R, clr.G, clr.B);
                Utilities.SetStateChanged(entity, "CBaseModelEntity", "m_clrRender");
            }
        }
    }

    public static void DisableFreezeLines()
    {
        foreach (var kvp in Blocks.Entities)
        {
            var entity = kvp.Key as CBaseModelEntity;
            if (entity == null) continue;
            var data = kvp.Value;
            if (data.Type == "Freeze Line")
            {
                entity.CollisionRulesChanged(CollisionGroup.COLLISION_GROUP_TRIGGER);
                entity.AcceptInput("DisableCollision");
                
                entity.Render = Color.FromArgb(40, 0, 255, 0); // Transparent Green
                Utilities.SetStateChanged(entity, "CBaseModelEntity", "m_clrRender");
            }
        }
    }

    public static void DropCTFlag()
    {
        if (CTFlagCarrier == null) return;

        var player = CTFlagCarrier;
        CTFlagCarrier = null;
        IsCTFlagDropped = true;
        CTFlagDroppedTime = 30f;

        var pos = player.PlayerPawn.Value?.AbsOrigin?.ToVector_t() ?? new Vector_t();
        CTFlagCurrentPosition = pos;

        if (CTFlagBlockEntity != null && CTFlagBlockEntity.IsValid)
        {
            CTFlagBlockEntity.Teleport(pos);
            CTFlagBlockEntity.Render = Color.Blue; // Make solid blue
            Utilities.SetStateChanged(CTFlagBlockEntity, "CBaseModelEntity", "m_clrRender");
            
            CTFlagBlockEntity.CollisionRulesChanged(CollisionGroup.COLLISION_GROUP_TRIGGER);
            CTFlagBlockEntity.AcceptInput("EnableCollision");
        }

        Utils.PrintToChatAll($"[CTF] The {ChatColors.Blue}CT Flag {ChatColors.Grey}was dropped by {ChatColors.Red}{player.PlayerName}!");
    }

    public static void DropTFlag()
    {
        if (TFlagCarrier == null) return;

        var player = TFlagCarrier;
        TFlagCarrier = null;
        IsTFlagDropped = true;
        TFlagDroppedTime = 30f;

        var pos = player.PlayerPawn.Value?.AbsOrigin?.ToVector_t() ?? new Vector_t();
        TFlagCurrentPosition = pos;

        if (TFlagBlockEntity != null && TFlagBlockEntity.IsValid)
        {
            TFlagBlockEntity.Teleport(pos);
            TFlagBlockEntity.Render = Color.Red; // Make solid red
            Utilities.SetStateChanged(TFlagBlockEntity, "CBaseModelEntity", "m_clrRender");
            
            TFlagBlockEntity.CollisionRulesChanged(CollisionGroup.COLLISION_GROUP_TRIGGER);
            TFlagBlockEntity.AcceptInput("EnableCollision");
        }

        Utils.PrintToChatAll($"[CTF] The {ChatColors.Red}T Flag {ChatColors.Grey}was dropped by {ChatColors.Blue}{player.PlayerName}!");
    }

    public static void ReturnCTFlagToBase(CCSPlayerController? returner)
    {
        IsCTFlagDropped = false;
        CTFlagCarrier = null;
        CTFlagCurrentPosition = CTFlagBasePosition;

        if (CTFlagBlockEntity != null && CTFlagBlockEntity.IsValid && CTFlagBasePosition != null)
        {
            CTFlagBlockEntity.Teleport(CTFlagBasePosition);
            
            var data = Blocks.Entities[CTFlagBlockEntity];
            var clr = Utils.GetColor(data.Color);
            int alpha = Utils.GetAlpha(data.Transparency);
            CTFlagBlockEntity.Render = Color.FromArgb(alpha, clr.R, clr.G, clr.B);
            Utilities.SetStateChanged(CTFlagBlockEntity, "CBaseModelEntity", "m_clrRender");
            
            CTFlagBlockEntity.CollisionRulesChanged(CollisionGroup.COLLISION_GROUP_TRIGGER);
            CTFlagBlockEntity.AcceptInput("EnableCollision");
        }

        if (returner != null)
        {
            Utils.PrintToChatAll($"[CTF] The {ChatColors.Blue}CT Flag {ChatColors.Grey}was returned to base by {ChatColors.Blue}{returner.PlayerName}!");
        }
        else
        {
            Utils.PrintToChatAll($"[CTF] The {ChatColors.Blue}CT Flag {ChatColors.Grey}has returned to base.");
        }
    }

    public static void ReturnTFlagToBase(CCSPlayerController? returner)
    {
        IsTFlagDropped = false;
        TFlagCarrier = null;
        TFlagCurrentPosition = TFlagBasePosition;

        if (TFlagBlockEntity != null && TFlagBlockEntity.IsValid && TFlagBasePosition != null)
        {
            TFlagBlockEntity.Teleport(TFlagBasePosition);
            
            var data = Blocks.Entities[TFlagBlockEntity];
            var clr = Utils.GetColor(data.Color);
            int alpha = Utils.GetAlpha(data.Transparency);
            TFlagBlockEntity.Render = Color.FromArgb(alpha, clr.R, clr.G, clr.B);
            Utilities.SetStateChanged(TFlagBlockEntity, "CBaseModelEntity", "m_clrRender");
            
            TFlagBlockEntity.CollisionRulesChanged(CollisionGroup.COLLISION_GROUP_TRIGGER);
            TFlagBlockEntity.AcceptInput("EnableCollision");
        }

        if (returner != null)
        {
            Utils.PrintToChatAll($"[CTF] The {ChatColors.Red}T Flag {ChatColors.Grey}was returned to base by {ChatColors.Red}{returner.PlayerName}!");
        }
        else
        {
            Utils.PrintToChatAll($"[CTF] The {ChatColors.Red}T Flag {ChatColors.Grey}has returned to base.");
        }
    }

    public static void UpdateCTFHUD()
    {
        if (!IsCTFActive) return;

        string ctfStatus = "<font color='darkorchid'><b>CAPTURE THE FLAG</b></font><br/>";
        ctfStatus += $"Score: <font color='blue'>CT {CTScores}</font> - <font color='red'>{TScores} T</font><br/>";

        if (FreezeRemaining > 0)
        {
            ctfStatus += $"<font color='orange'>Freeze Lines active: {(int)FreezeRemaining}s</font><br/>";
        }
        else
        {
            ctfStatus += "<font color='green'>Freeze Lines deactivated!</font><br/>";
        }

        string ctFlagStr = CTFlagCarrier != null ? $"Carrier: <font color='red'>{CTFlagCarrier.PlayerName}</font>" : (IsCTFlagDropped ? $"Dropped ({CTFlagDroppedTime:0}s)" : "Home");
        string tFlagStr = TFlagCarrier != null ? $"Carrier: <font color='blue'>{TFlagCarrier.PlayerName}</font>" : (IsTFlagDropped ? $"Dropped ({TFlagDroppedTime:0}s)" : "Home");

        ctfStatus += $"<font color='blue'>CT Flag:</font> {ctFlagStr}<br/>";
        ctfStatus += $"<font color='red'>T Flag:</font> {tFlagStr}";

        foreach (var player in Utilities.GetPlayers())
        {
            if (player != null && player.IsValid && !player.IsBot && player.Connected == PlayerConnectedState.PlayerConnected)
            {
                player.PrintToCenterHtml(ctfStatus);
            }
        }
    }
}
