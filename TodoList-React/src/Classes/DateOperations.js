/* eslint-disable no-const-assign */

const Months = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const Days = ["Domingo","Segunda","Terça","Quarta","Quinta","Sexta","Sábado"];

function Now(){
    return new Date();
}

function Tomorrow(){
    let nowToTomorrow  = Now();
    nowToTomorrow.setDate(nowToTomorrow.getDate() + 1);
    return nowToTomorrow;
}

function AddDays(date,counts){
    date.setDate(date.getDate() + counts);
    return date;
}

function SomDays(date,days){
    let newDate = new Date(date.getTime());
    return AddDays(newDate,days);
}

function DateComparison(data1,date2){
    let dt1 = data1.getTime();
    let dt2 = date2.getTime();
    if(dt1 < dt2){
        return -1;
    }else if(dt1 == dt2){
        return 0;
    }
    return 1;
}

function DateToZeroHours(date){
    return new Date(date.getFullYear(),date.getMonth(),date.getDate(),0,0,0,0);
}

function IsPendent(conclusao,expiracao,validade) {
    return !IsConclued(conclusao) && !IsExpired(conclusao, expiracao) && DateComparison(DateToZeroHours(validade), DateToZeroHours(Now())) == -1;
}

function IsConclued(date){
        return DateComparison(DateToZeroHours(date),new Date(1800,11,31,0,0,0,0)) != 0;
    }

    function IsExpired(conclusao,expiracao){
        if(!IsConclued(conclusao))
        {
            return DateComparison(expiracao,DateToZeroHours(Now())) == -1;
        }
        return DateComparison(conclusao,expiracao) == 1;
    }

export { Months, Days , Now , Tomorrow, AddDays, SomDays, DateComparison, IsConclued, IsExpired, DateToZeroHours, IsPendent }