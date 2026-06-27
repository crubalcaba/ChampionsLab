"use client";

import { motion } from "@/lib/motion";
import {
  Heart, Code, Users,
  AlertCircle, Code2, Globe, Sparkles,
  Shield,
} from "lucide-react";
import { LastUpdated } from "@/components/last-updated";
import { useI18n } from "@/lib/i18n";

export default function AboutPage() {
  const { t } = useI18n();


  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Alpha Banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-500/10 dark:to-orange-500/5 border border-amber-200/80 dark:border-amber-400/20"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-500/20">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-amber-800 dark:text-amber-300">{t("about.alphaRelease")}</p>
            <p className="text-xs text-amber-700/80 dark:text-amber-400/80 mt-0.5">
              {t("about.alphaDescription")}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10"
      >
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-500 shadow-lg shadow-rose-500/25">
            <Heart className="w-8 h-8 text-white fill-white" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">
                <span className="bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent">
                  {t("about.title")}
                </span>
              </h1>
              <LastUpdated page="meta" />
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {t("about.subtitle")}
            </p>
          </div>
        </div>
      </motion.div>

      {/* About Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-8"
      >
        {/* Mission */}
        <div className="glass rounded-2xl p-6 border border-rose-200/60 dark:border-rose-400/20 bg-gradient-to-br from-rose-50/40 to-pink-50/40 dark:from-rose-500/10 dark:to-pink-500/5">
          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="w-5 h-5 text-rose-500" />
            <h2 className="text-lg font-bold">{t("about.whyWeBuilt")}</h2>
          </div>
          <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
            <p dangerouslySetInnerHTML={{ __html: t("about.mission.p1") }} />
            <p dangerouslySetInnerHTML={{ __html: t("about.mission.p2") }} />
            <p dangerouslySetInnerHTML={{ __html: t("about.mission.p3") }} />
          </div>
        </div>

        {/* Key Facts */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="glass rounded-2xl p-5 border border-amber-200/60 dark:border-amber-400/20 text-center">
            <AlertCircle className="w-6 h-6 text-amber-500 mx-auto mb-2" />
            <p className="text-2xl font-extrabold font-heading text-amber-700 dark:text-amber-400">{t("about.facts.alpha")}</p>
            <p className="text-xs text-muted-foreground mt-1">{t("about.facts.alphaDesc")}</p>
          </div>
          <div className="glass rounded-2xl p-5 border border-gray-200/60 dark:border-gray-200/10 text-center">
            <Code className="w-6 h-6 text-violet-500 mx-auto mb-2" />
            <p className="text-2xl font-extrabold font-heading text-violet-700 dark:text-violet-400">{t("about.facts.openSource")}</p>
            <p className="text-xs text-muted-foreground mt-1">{t("about.facts.openSourceDesc")}</p>
          </div>
          <div className="glass rounded-2xl p-5 border border-gray-200/60 dark:border-gray-200/10 text-center">
            <Heart className="w-6 h-6 text-rose-500 mx-auto mb-2 fill-rose-500" />
            <p className="text-2xl font-extrabold font-heading text-rose-700 dark:text-rose-400">{t("about.facts.free")}</p>
            <p className="text-xs text-muted-foreground mt-1">{t("about.facts.freeDesc")}</p>
          </div>
          <div className="glass rounded-2xl p-5 border border-gray-200/60 dark:border-gray-200/10 text-center">
            <Users className="w-6 h-6 text-cyan-500 mx-auto mb-2" />
            <p className="text-2xl font-extrabold font-heading text-cyan-700 dark:text-cyan-400">{t("about.facts.community")}</p>
            <p className="text-xs text-muted-foreground mt-1">{t("about.facts.communityDesc")}</p>
          </div>
        </div>

        {/* Credits */}
        <div className="glass rounded-2xl p-6 border border-violet-200/60 dark:border-violet-400/20 bg-gradient-to-br from-violet-50/40 to-indigo-50/40 dark:from-violet-500/10 dark:to-indigo-500/5">
          <div className="flex items-center gap-3 mb-4">
            <Users className="w-5 h-5 text-violet-500" />
            <h2 className="text-lg font-bold">{t("about.creditsTitle")}</h2>
          </div>
          <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
            <p dangerouslySetInnerHTML={{ __html: t("about.credits.p1") }} />
            <p dangerouslySetInnerHTML={{ __html: t("about.credits.p2") }} />
            <p dangerouslySetInnerHTML={{ __html: t("about.credits.p3") }} />
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
            <Globe className="w-3.5 h-3.5" />
            <span>championslab.xyz</span>
          </div>
        </div>

        {/* Contribute */}
        <div className="glass rounded-2xl p-6 border border-emerald-200/60 dark:border-emerald-400/20 bg-gradient-to-br from-emerald-50/40 to-cyan-50/40 dark:from-emerald-500/10 dark:to-cyan-500/5">
          <div className="flex items-center gap-3 mb-4">
            <Code2 className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-bold">{t("about.wantToHelp")}</h2>
          </div>
          <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
            <p dangerouslySetInnerHTML={{ __html: t("about.contribute.p1") }} />
            <p dangerouslySetInnerHTML={{ __html: t("about.contribute.p2").replace(
              /<github>(.*?)<\/github>/,
              (_: string, label: string) => `<a href="https://github.com/Andrew21P/ChampionsLab" target="_blank" rel="noopener noreferrer" class="font-semibold text-emerald-600 hover:text-emerald-700 underline underline-offset-2">${label}</a>`
            ) }} />
            <p>{t("about.contribute.p3")}</p>
          </div>
        </div>

        {/* Legal & Disclaimers */}
        <div className="glass rounded-2xl p-6 border border-amber-200/80 dark:border-amber-500/30 bg-gradient-to-br from-amber-50/60 to-orange-50/60 dark:from-amber-950/60 dark:to-orange-950/60">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <h2 className="text-lg font-bold text-amber-900 dark:text-amber-200">{t("about.legalTitle")}</h2>
          </div>
          <div className="space-y-3 text-sm text-amber-800/90 dark:text-amber-300/90 leading-relaxed">
            <p dangerouslySetInnerHTML={{ __html: t("about.legal.unofficial") }} />
            <p dangerouslySetInnerHTML={{ __html: t("about.legal.ip") }} />
            <p dangerouslySetInnerHTML={{ __html: t("about.legal.noAffiliation") }} />
            <p dangerouslySetInnerHTML={{ __html: t("about.legal.privacyTerms") }} />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
